
/**
 * @file Razor grammar for tree-sitter
 * @author Yes <No@lol.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
//

const HTML = require("tree-sitter-html/grammar");

module.exports = grammar( {
  name: "razor",

  extras: ($) => [$.razor_comment, $.razor_variable, $.razor_expression, /\s/],

  rules: {
    source_file: ($) =>
      repeat(
        choice(
          $.directive,
          $.razor_comment,
          $.html_element,
          $.razor_expression,
          $.razor_variable,
          $.code_block,
        ),
      ),

    _razor_identifier: () => token("@"),
    _razor_directive_words: () => choice("page", "inject", "rendermode"),

    code_block: ($) =>
      seq($._razor_identifier, "code", "{", repeat($._balanced_content), "}"),

    _html_open_tag: ($) => seq("<", $._tag_name, optional(">")),

    _html_close_tag: ($) => choice("/>", seq("</", $._tag_name, ">")),

    html_element: ($) =>
      seq($._html_open_tag, repeat($._balanced_tags), $._html_close_tag),

    directive: ($) =>
      seq(
        $._razor_identifier,
        $._razor_directive_words,
        seq(choice($.identifier, $.string_literal), optional($.variable)),
      ),

    razor_expression: ($) =>
      seq($._razor_identifier, "(", repeat($._identifier), ")"),

    razor_variable: ($) => seq($._razor_identifier, $._identifier),

    _identifier: () => /[a-zA-Z_][a-zA-Z0-9_.]*/,
    identifier: () => prec(1, /[a-zA-Z_][a-zA-Z0-9_.]*/),
    string_literal: () => seq('"', repeat(/[^"]+/), '"'),
    _tag_name: () => /[a-zA-Z][a-zA-Z0-9]*/,

    variable: ($) => seq($._identifier),

    _balanced_content: ($) =>
      choice(/[^{}]+/, seq("{", repeat($._balanced_content), "}")),

    _balanced_tags: ($) =>
      choice(
        prec.left(
          seq(
            $._html_close_tag,
            repeat(choice($._balanced_tags)),
            $._html_close_tag,
          ),
        ),
      ),

    razor_comment: () => seq("@*", /[^*]*\*+([^@][^*]*\*+)*@/),
    text: () => /[^<>&\s]([^<>&]*[^<>&\s])?/,
  },
});
