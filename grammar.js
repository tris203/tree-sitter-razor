/**
 * @file Razor grammar for tree-sitter
 * @author Tristan Knight <admin@snappeh.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const CSHARP = require("tree-sitter-c-sharp/grammar").default;

module.exports = grammar(CSHARP, {
  name: "razor",

  externals: ($, previous) => [
    ...previous,
    $._html_attribute_tail_text,
  ],

  extras: ($) => [$.razor_comment, $.comment, /\s+/],

  conflicts: ($, o) => [
    [$.razor_explicit_expression, $._expression_statement_expression],

    [
      $.preproc_if,
      $.preproc_if_in_top_level,
      $.preproc_if_in_expression,
      $.preproc_if_in_attribute_list,
    ],
    [$.preproc_if, $.preproc_if_in_top_level],
    [$.preproc_if, $.preproc_if_in_top_level, $.preproc_if_in_expression],
    [$.preproc_if, $.preproc_if_in_top_level, $.preproc_if_in_attribute_list],
    [
      $.preproc_else,
      $.preproc_else_in_top_level,
      $.preproc_else_in_expression,
      $.preproc_else_in_attribute_list,
    ],
    [$.declaration, $.preproc_if_in_top_level],
    [$.type_declaration, $.declaration],
    [$.method_declaration, $._local_function_declaration],
    [$.declaration, $.preproc_else_in_top_level],
    [
      $.preproc_elif,
      $.preproc_elif_in_top_level,
      $.preproc_elif_in_expression,
      $.preproc_elif_in_attribute_list,
    ],

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
            $.razor_addtaghelper_directive,
            $.razor_removetaghelper_directive,
            $.razor_taghelperprefix_directive,
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
          $.explicit_line_transition,
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
        field("name", $.identifier),
        optional($.type_parameter_constraints_clause),
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
    razor_rendermode: ($) =>
      prec(
        1,
        choice(
          $.razor_explicit_expression,
          $.razor_implicit_expression,
          $.member_access_expression,
          $.identifier,
        ),
      ),

    switch_expression_arm: ($) =>
      seq(
        $.pattern,
        optional($.when_clause),
        "=>",
        choice($.expression, $.razor_template),
      ),

    razor_template: ($) =>
      seq(alias($._razor_marker, "at_template"), $.element),

    _taghelper_target: ($) =>
      seq(
        choice($.identifier, alias("*", $.taghelper_wildcard)),
        ",",
        field("assembly", $._name),
      ),
    razor_addtaghelper_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "addTagHelper"), "at_addtaghelper"),
        choice($.string_literal, $._taghelper_target),
      ),
    razor_removetaghelper_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "removeTagHelper"), "at_removetaghelper"),
        choice($.string_literal, $._taghelper_target),
      ),
    razor_taghelperprefix_directive: ($) =>
      seq(
        alias(seq($._razor_marker, "tagHelperPrefix"), "at_taghelperprefix"),
        choice($.string_literal, $.identifier),
      ),

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
        token(prec(10, "catch")),
        repeat(choice($.catch_declaration, $.catch_filter_clause)),
        "{",
        $._blended_content,
        "}",
      ),

    razor_finally: ($) =>
      seq(
        token(prec(10, "finally")),
        "{",
        $._blended_content,
        "}"
      ),

    razor_else_if: ($) =>
      seq(
        token(prec(10, "else")),
        "if",
        $.razor_condition,
        "{",
        $._blended_content,
        "}"
      ),

    razor_else: ($) =>
      seq(
        token(prec(10, "else")),
        "{",
        $._blended_content,
        "}"
      ),

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
      prec.left(
        seq(
          alias("@:", "at_colon_transition"),
          alias(token(prec(1, /[^\n\r]+/)), $.element),
        ),
      ),

    razor_comment: ($) => seq("@*", optional($._razor_comment_text), "*@"),
    _razor_comment_text: (_) => repeat1(/.|\n|\r/),
    razor_attribute_name: ($) =>
      seq(
        $._razor_marker,
        seq(
          choice(
            "attributes",
            token(prec(10, /bind(-[A-Za-z_][A-Za-z0-9_]*)?/)),
            "formname",
            token(prec(10, /on[a-z]+/i)),
            "key",
            "ref",
            "rendermode",
          ),
          optional($.razor_attribute_modifier),
        ),
      ),

    razor_attribute_modifier: (_) =>
      choice(
        ":culture",
        ":preventDefault",
        ":stopPropagation",
        ":event",
        ":format",
        ":get",
        ":set",
        ":after",
      ),

    html_comment: ($) => seq("<!--", optional($._razor_comment_text), "-->"),
    _html_comment_text: (_) => repeat1(/.|\n|\r/),

    // HTML Base Definitions
    _tag_name: (_) => /[a-zA-Z0-9-:]+/,
    _end_tag: ($) => seq("</", $._tag_name, ">"),
    _html_attribute_name: (_) => /[a-z][a-zA-Z0-9-:]*/,
    _boolean_html_attribute: (_) => /[a-z][a-zA-Z0-9-:]*/,
    _component_attribute_name: (_) => /[A-Z][a-zA-Z0-9-:]*/,
    _component_type_attribute_name: (_) =>
      token(prec(1, /T[A-Z][a-zA-Z0-9]*/)),
    _component_type_attribute_value: ($) =>
      seq('"', prec.dynamic(3, $.type), '"'),
    _html_attribute_value: ($) =>
      choice(
        seq(
          '"',
          repeat(
            choice(
              $.razor_explicit_expression,
              $.razor_implicit_expression,
            ),
          ),
          '"',
        ),
        prec.dynamic(
          1,
          seq(
            '"',
            token(prec(1, /[^"@]+/)),
            repeat(
              choice(
                $.razor_explicit_expression,
                $.razor_implicit_expression,
                $._html_attribute_tail_text,
              ),
            ),
            '"',
          ),
        ),
        prec.dynamic(
          2,
          seq(
            '"',
            choice(
              $.razor_explicit_expression,
              $.razor_implicit_expression,
            ),
            $._html_attribute_tail_text,
            repeat(
              choice(
                $.razor_explicit_expression,
                $.razor_implicit_expression,
                $._html_attribute_tail_text,
              ),
            ),
            '"',
          ),
        ),
      ),
    _html_text: (_) => /[^<>&@.(\s]([^<>&@]*[^<>&@\s])?/,
    _parenthesized_html_text: (_) =>
      token(prec(1, /[^<>&@().\s]([^<>&@()]*[^<>&@()\s])?/)),
    _parenthesized_html_content: ($) =>
      seq(
        "(",
        repeat(
          choice(
            $._node,
            $._parenthesized_html_text,
            $._parenthesized_html_content,
          ),
        ),
        ")",
      ),

    razor_attribute_value: ($) =>
      seq(
        '"',
        optional($.modifier),
        choice(
          $.razor_explicit_expression,
          $.razor_implicit_expression,
          $.expression,
        ),
        '"',
      ),

    _html_attribute: ($) =>
      seq($._html_attribute_name, "=", $._html_attribute_value),

    component_attribute_value: ($) =>
      choice(
        token(prec(20, '""')),
        seq(
          '"',
          choice(
            $.razor_explicit_expression,
            $.razor_implicit_expression,
            prec.dynamic(2, $.expression),
          ),
          '"',
        ),
        seq('"', /[^"@]+/, '"'),
      ),

    component_attribute: ($) =>
      choice(
        seq(
          $._component_type_attribute_name,
          optional(
            seq(
              "=",
              alias(
                $._component_type_attribute_value,
                $.component_attribute_value,
              ),
            ),
          ),
        ),
        seq(
          $._component_attribute_name,
          optional(seq("=", $.component_attribute_value)),
        ),
      ),

    _razor_bind_format_attribute_name: ($) =>
      prec(
        1,
        seq(
          $._razor_marker,
          token(prec(10, /bind(-[A-Za-z_][A-Za-z0-9_]*)?/)),
          alias(":format", $.razor_attribute_modifier),
        ),
      ),
    _razor_bind_format_attribute_value: ($) =>
      seq('"', optional($.razor_attribute_text), '"'),
    razor_attribute_text: (_) => /[^"@]+/,

    razor_html_attribute: ($) =>
      choice(
        prec.dynamic(
          3,
          seq(
            alias(
              $._razor_bind_format_attribute_name,
              $.razor_attribute_name,
            ),
            optional(
              seq(
                "=",
                alias(
                  $._razor_bind_format_attribute_value,
                  $.razor_attribute_value,
                ),
              ),
            ),
          ),
        ),
        seq(
          $.razor_attribute_name,
          optional(seq("=", $.razor_attribute_value)),
        ),
      ),

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
                  $.component_attribute,
                ),
                optional(" "),
              ),
            ),
          ),
        ),
        choice(
          "/>",
          seq(
            ">",
            repeat(
              choice(
                $._parenthesized_html_content,
                $._node,
                $._html_text,
              ),
            ),
            $._end_tag,
          ),
        ),
      ),
  },
});
