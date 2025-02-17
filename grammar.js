/**
 * @file Razor grammar for tree-sitter
 * @author Tristan Knight <admin@snappeh.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const CSHARP = require("tree-sitter-c-sharp/grammar");

module.exports = grammar(CSHARP, {
  name: "razor",

  extras: ($) => [$.razor_comment, $.comment, /\s+/],

  conflicts: ($, o) => [
    [$.razor_explicit_expression, $._expression_statement_expression],

    [$.preproc_if, $.preproc_if_in_top_level],
    [$.preproc_if, $.preproc_if_in_top_level, $.preproc_if_in_expression],
    [$.preproc_else, $.preproc_else_in_top_level, $.preproc_else_in_expression],
    [$.declaration, $.preproc_if_in_top_level],
    [$.type_declaration, $.declaration],
    [$.method_declaration, $.local_function_statement],
    [$.declaration, $.preproc_else_in_top_level],
    [$.preproc_elif, $.preproc_elif_in_top_level, $.preproc_elif_in_expression],

    [$.destructor_declaration, $._simple_name],

    [$.initializer_expression, $.razor_block],
    [$.field_declaration, $.local_declaration_statement],
    ...o,
  ],

  rules: {
    compilation_unit: ($) =>
      seq(
        repeat(
          choice(
            $.shebang_directive, // this is to make sharing highlights easier
            $.razor_page_directive,
            $.razor_using_directive,
            $.razor_model_directive,
            $.razor_rendermode_directive,
            $.razor_inject_directive,
            $.razor_implements_directive,
            $.razor_layout_directive,
            $.razor_inherits_directive,
            $.razor_attribute_directive,
            $.razor_typeparam_directive,
            $.razor_namespace_directive,
            $.razor_preservewhitespace_directive,
          ),
        ),
        repeat(choice($._node, $.razor_block)),
      ),

    _identifier_token: (_) =>
      token(
        // @ts-ignore
        /(\p{XID_Start}|_|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})(\p{XID_Continue}|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})*/,
      ),
    identifier: ($) => choice($._identifier_token, $._reserved_identifier),

    _csharp_nodes: ($) =>
      choice(
        $.statement,
        $._node,

        $.preproc_region,
        $.preproc_endregion,
        $.preproc_line,
        $.preproc_pragma,
        $.preproc_nullable,
        $.preproc_error,
        $.preproc_warning,
        $.preproc_define,
        $.preproc_undef,
      ),

    block: ($) => seq("{", repeat($._csharp_nodes), "}"),

    _node: ($) =>
      prec.right(
        choice(
          $.razor_comment,
          $.razor_escape,
          $.razor_if,
          $.razor_switch,
          $.razor_for,
          $.razor_foreach,
          $.razor_while,
          $.razor_do_while,
          $.razor_try,
          $.razor_await_expression,
          $.razor_implicit_expression,
          $.razor_explicit_expression,
          $.razor_section,
          $.razor_compound_using,
          $.razor_lock,
          $.element,
          $.html_comment,
        ),
      ),

    _razor_marker: (_) => token("@"),

    razor_escape: ($) =>
      seq(alias(/@{2}/, "at_at_escape"), alias($._html_text, $.element)),

    razor_page_directive: ($) =>
      seq(alias(seq($._razor_marker, "page"), "at_page"), $.string_literal),
    razor_using_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "using"), "at_using"),
        choice(
          seq(optional("unsafe"), field("name", $.identifier), "=", $.type),
          seq(optional("static"), optional("unsafe"), $._name),
        ),
      ),
    razor_model_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "model"), "at_model"),
        field("name", $._name),
      ),
    razor_preservewhitespace_directive: ($) =>
      seq(
        alias(
          seq($._razor_marker, "preservewhitespace"),
          "at_preservewhitespace",
        ),
        $.boolean_literal,
      ),
    razor_attribute_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "attribute"), "at_attribute"),
        $.attribute_list,
      ),
    razor_implements_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "implements"), "at_implements"),
        field("name", $._name),
      ),
    razor_layout_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "layout"), "at_layout"),
        field("name", $._name),
      ),
    razor_inherits_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "inherits"), "at_inherits"),
        field("name", $._name),
      ),
    razor_typeparam_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "typeparam"), "at_typeparam"),
        field("name", $._name),
      ),
    razor_inject_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "inject"), "at_inject"),
        $.variable_declaration,
      ),
    razor_namespace_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "namespace"), "at_namespace"),
        $.qualified_name,
      ),
    razor_rendermode_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "rendermode"), "at_rendermode"),
        $.razor_rendermode,
      ),
    razor_rendermode: (_) =>
      choice("InteractiveServer", "InteractiveWebAssembly", "InteractiveAuto"),

    razor_block: ($) =>
      prec.left(
        seq(
          alias(
            seq($._razor_marker, optional(choice("code", "functions"))),
            "at_block",
          ),
          "{",
          repeat(choice($.declaration, seq($.statement), $._node)),
          "}",
        ),
      ),

    razor_explicit_expression: ($) =>
      prec.right(
        seq(
          alias($._razor_marker, "at_explicit"),
          prec.right($.parenthesized_expression),
        ),
      ),

    razor_implicit_expression: ($) =>
      seq(alias($._razor_marker, "at_implicit"), prec.left($.expression)),

    razor_await_expression: ($) =>
      seq(
        alias(seq($._razor_marker, "await"), "at_await"),
        prec.right($.expression),
      ),

    razor_lock: ($) =>
      seq(
        alias(seq($._razor_marker, "lock"), "at_lock"),
        "(",
        $.expression,
        ")",
        "{",
        $._blended_content,
        "}",
      ),

    razor_compound_using: ($) =>
      seq(
        alias(seq($._razor_marker, "using"), "at_using"),
        "(",
        choice(
          alias($.using_variable_declaration, $.variable_declaration),
          $.expression,
        ),
        ")",
        "{",
        $._blended_content,
        "}",
      ),

    razor_if: ($) =>
      seq(
        alias(seq($._razor_marker, "if"), "at_if"),
        $.razor_condition,
        seq("{", $._blended_content, "}"),
        repeat(choice($.razor_else_if, $.razor_else)),
      ),

    razor_try: ($) =>
      prec.right(
        seq(
          alias(seq($._razor_marker, "try"), "at_try"),
          "{",
          $._blended_content,
          "}",
          repeat(choice($.razor_catch, $.razor_finally)),
        ),
      ),

    razor_catch: ($) =>
      seq(
        "catch",
        repeat(choice($.catch_declaration, $.catch_filter_clause)),
        "{",
        $._blended_content,
        "}",
      ),

    razor_finally: ($) => seq("finally", "{", $._blended_content, "}"),

    razor_else_if: ($) =>
      seq("else if", $.razor_condition, "{", $._blended_content, "}"),

    razor_else: ($) => seq("else", "{", $._blended_content, "}"),

    razor_switch: ($) =>
      seq(
        alias(seq($._razor_marker, "switch"), "at_switch"),
        $.razor_condition,
        "{",
        repeat(choice($.razor_switch_case, $.razor_switch_default)),
        "}",
      ),

    razor_condition: ($) => prec(10, seq("(", $.expression, ")")),

    razor_switch_case: ($) =>
      prec.left(
        seq(
          "case",
          $.razor_case_condition,
          ":",
          $._blended_content,
          optional("break;"),
        ),
      ),

    razor_switch_default: ($) =>
      prec.right(seq("default", ":", $._blended_content, optional("break;"))),

    razor_case_condition: (_) => /[^:]+/,

    _razor_for_initializer: ($) =>
      seq(
        alias(seq($._razor_marker, "for"), "at_for"),
        "(",
        field(
          "initializer",
          optional(choice($.variable_declaration, $.expression)),
        ),
        ";",
        field("condition", optional($.expression)),
        ";",
        field("update", optional($.expression)),
        ")",
      ),

    razor_for: ($) =>
      seq(
        $._razor_for_initializer,
        "{",
        field("body", $._blended_content),
        "}",
      ),

    _blended_content: ($) =>
      repeat1(
        prec(
          10,
          choice($._node, $.explicit_line_transition, $.statement, $.comment),
        ),
      ),

    _razor_foreach_initializer: ($) =>
      seq(
        alias(seq($._razor_marker, "foreach"), "at_foreach"),
        "(",
        choice(
          seq(
            field("type", $.type),
            field("left", choice($.identifier, $.tuple_pattern)),
          ),
          field("left", $.expression),
        ),
        "in",
        field("right", $.expression),
        ")",
      ),

    razor_foreach: ($) =>
      seq(
        $._razor_foreach_initializer,
        "{",
        field("body", $._blended_content),
        "}",
      ),

    razor_while: ($) =>
      seq(
        alias(seq($._razor_marker, "while"), "at_while"),
        $.razor_condition,
        "{",
        $._blended_content,
        "}",
      ),

    _razor_while_condition: ($) => seq("while", $.razor_condition),

    razor_do_while: ($) =>
      seq(
        alias(seq($._razor_marker, "do"), "at_do"),
        "{",
        $._blended_content,
        "}",
        $._razor_while_condition,
        ";",
      ),

    razor_section: ($) =>
      seq(
        alias(seq($._razor_marker, "section"), "at_section"),
        $.identifier,
        "{",
        $._blended_content,
        "}",
      ),

    explicit_line_transition: ($) =>
      prec.left(seq(alias("@:", "at_colon_transition"), repeat1(/[^\n\r]+/))),

    razor_comment: ($) => seq("@*", optional($._razor_comment_text), "*@"),
    _razor_comment_text: (_) => repeat1(/.|\n|\r/),
    razor_attribute_name: ($) =>
      seq(
        $._razor_marker,
        seq(
          choice(
            "attributes",
            "bind",
            "formname",
            token(prec(10, /on[a-z]+/i)),
            "key",
            "ref",
          ),
          optional($.razor_attribute_modifier),
        ),
      ),

    razor_attribute_modifier: (_) =>
      choice(":culture", ":preventDefault", ":stopPropagation"),

    html_comment: ($) => seq("<!--", optional($._razor_comment_text), "-->"),
    _html_comment_text: (_) => repeat1(/.|\n|\r/),

    // HTML Base Definitions
    _tag_name: (_) => /[a-zA-Z0-9-:]+/,
    _end_tag: ($) => seq("</", $._tag_name, ">"),
    _html_attribute_name: (_) => /[a-zA-Z0-9-:]+/,
    _boolean_html_attribute: (_) => /[a-zA-Z0-9-:]+/,
    _html_attribute_value: ($) =>
      seq(
        '"',
        optional(
          choice(
            $.razor_explicit_expression,
            $.razor_implicit_expression,
            prec.left(/[a-zA-Z0-9-:/\.=>(){}\s]+/),
          ),
        ),
        '"',
      ),
    _html_text: (_) => /[^<>&@.(\s]([^<>&@]*[^<>&@\s])?/,

    razor_attribute_value: ($) =>
      seq('"', optional($.modifier), $.expression, '"'),

    _html_attribute: ($) =>
      seq($._html_attribute_name, "=", $._html_attribute_value),

    razor_html_attribute: ($) =>
      seq($.razor_attribute_name, optional(seq("=", $.razor_attribute_value))),

    element: ($) =>
      seq(
        "<",
        $._tag_name,
        optional(
          repeat(
            prec.left(
              seq(
                choice(
                  $._html_attribute,
                  $._boolean_html_attribute,
                  $.razor_html_attribute,
                ),
                optional(" "),
              ),
            ),
          ),
        ),
        choice(
          "/>",
          seq(">", repeat(choice($._node, $._html_text)), $._end_tag),
        ),
      ),
  },
});
