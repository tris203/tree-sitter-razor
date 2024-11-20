/**
 * @file Razor grammar for tree-sitter
 * @author Yes <No@lol.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const CSHARP = require("tree-sitter-c-sharp/grammar");

module.exports = grammar(CSHARP, {
  name: "razor",

  extras: ($) => [$.razor_comment, /\s+/],

  rules: {
    // document: ($) => repeat($._node),
    compilation_unit: ($) =>
      repeat1(
        choice(
          $._node,
          seq(
            "donotmatchthiseveriwanttoburnthisrulebut",
            $._top_level_item,
            "ifyouremovethisforsomereasontreesitterdoesntcompile",
          ),
        ),
      ),

    _identifier_token: (_) =>
      token(
        // seq(
        // optional("@"),
        // @ts-ignore
        /(\p{XID_Start}|_|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})(\p{XID_Continue}|\\u[0-9A-Fa-f]{4}|\\U[0-9A-Fa-f]{8})*/,
        // ),
      ),
    identifier: ($) => choice($._identifier_token, $._reserved_identifier),

    _node: ($) =>
      prec.right(
        choice(
          $.razor_comment,
          $.razor_page_directive,
          $.razor_using_directive,
          $.razor_rendermode_directive,
          $.razor_inject_directive,
          $.razor_escape,
          $.razor_if,
          $.razor_switch,
          $.razor_block,
          $.razor_for,
          $.razor_foreach,
          $.razor_while,
          $.razor_do_while,
          $.razor_await_expression,
          $.razor_implicit_expression,
          $.razor_explicit_expression,
          $.element,
        ),
      ),

    _razor_marker: (_) => token("@"),

    razor_escape: ($) => seq(/@{2}/, $.html_text),

    _razor_code_keyword: (_) => choice("code", "functions"),
    _razor_await_keyword: (_) => "await",

    razor_page_directive: ($) => seq($._razor_marker, "page", $.string_literal),
    razor_using_directive: ($) =>
      seq(
        $._razor_marker,
        "using",
        choice(
          seq(optional("unsafe"), field("name", $.identifier), "=", $.type),
          seq(optional("static"), optional("unsafe"), $._name),
        ),
      ),
    razor_inject_directive: ($) =>
      seq($._razor_marker, "inject", $.qualified_name, $.identifier),
    razor_rendermode_directive: ($) =>
      seq($._razor_marker, "rendermode", $.razor_rendermode),
    razor_rendermode: (_) =>
      choice("InteractiveServer", "InteractiveWebAssembly", "InteractiveAuto"),

    _supported_c_sharp_rules: ($) =>
      prec(-10, repeat1(choice($.statement, $.comment))),

    razor_block: ($) =>
      seq(
        $._razor_marker,
        optional($._razor_code_keyword),
        "{",
        $._blended_content,
        "}",
      ),

    razor_explicit_expression: ($) =>
      seq($._razor_marker, seq("(", prec.right($.expression), ")")),

    razor_implicit_expression: ($) =>
      seq($._razor_marker, /[^({]{1}/, prec.right($.expression)),

    razor_await_expression: ($) =>
      seq($._razor_marker, $._razor_await_keyword, prec.right($.expression)),

    razor_if: ($) =>
      seq(
        $._razor_marker,
        "if",
        $.razor_condition,
        seq("{", $._blended_content, "}"),
        optional(repeat($.razor_else_if)),
        optional($.razor_else),
      ),

    razor_else_if: ($) =>
      seq("else if", $.razor_condition, "{", $._blended_content, "}"),

    razor_else: ($) => seq("else", "{", $._blended_content, "}"),

    razor_switch: ($) =>
      seq(
        $._razor_marker,
        "switch",
        $.razor_condition,
        "{",
        repeat($.razor_switch_case),
        optional($.razor_switch_default),
        "}",
      ),

    razor_condition: ($) => seq("(", $.expression, ")"),

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

    razor_for: ($) =>
      seq(
        $._razor_marker,
        "for",
        "(",
        field(
          "initializer",
          optional(choice($.variable_declaration, commaSep1($.expression))),
        ),
        ";",
        field("condition", optional($.expression)),
        ";",
        field("update", optional(commaSep1($.expression))),
        ")",
        "{",
        field("body", $._blended_content),
        "}",
      ),

    _blended_content: ($) =>
      repeat1(
        choice($._node, $.explicit_line_transition, $._supported_c_sharp_rules),
      ),

    razor_foreach: ($) =>
      seq(
        $._razor_marker,
        "foreach",
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
        "{",
        field("body", $._blended_content),
        "}",
      ),

    razor_while: ($) =>
      seq(
        $._razor_marker,
        "while",
        $.razor_condition,
        "{",
        $._blended_content,
        "}",
      ),

    razor_do_while: ($) =>
      seq(
        $._razor_marker,
        "do",
        "{",
        $._blended_content,
        "}",
        "while",
        $.razor_condition,
        ";",
      ),

    explicit_line_transition: ($) =>
      prec.left(seq("@:", optional($.html_text), repeat1($._node))),

    razor_comment: ($) => seq("@*", optional($._comment_text), "*@"),
    _comment_text: (_) => repeat1(/.|\n|\r/),

    // HTML Base Definitions
    tag_name: (_) => /[a-zA-Z0-9-]+/,
    html_attribute_name: (_) => /[a-zA-Z0-9-]+/,
    _razor_attribute_name: ($) => seq($._razor_marker, /[a-zA-Z0-9-:]+/),
    _html_attribute_value: (_) => /[a-zA-Z0-9-\s]+/,
    html_attribute_value: ($) =>
      seq(
        '"',
        choice(
          $.razor_explicit_expression,
          $.razor_implicit_expression,
          prec.left($._html_attribute_value),
        ),
        '"',
      ),
    html_text: (_) => /[^<>&@.(\s]([^<>&@]*[^<>&@\s])?/,

    razor_attribute_value: ($) => seq('"', $.expression, '"'),

    html_attribute: ($) =>
      seq($.html_attribute_name, "=", $.html_attribute_value),

    razor_html_attribute: ($) =>
      seq($._razor_attribute_name, "=", $.razor_attribute_value),

    start_tag: ($) =>
      seq(
        "<",
        $.tag_name,
        optional(
          repeat(
            prec.left(
              seq(
                choice($.html_attribute, $.razor_html_attribute),
                optional(" "),
              ),
            ),
          ),
        ),
        ">",
      ),

    end_tag: ($) => seq("</", $.tag_name, ">"),

    element: ($) =>
      seq($.start_tag, repeat(choice($._node, $.html_text)), $.end_tag),
  },
});

/**
 * @param {RuleOrLiteral} rule
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
