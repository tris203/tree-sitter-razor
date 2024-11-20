package tree_sitter_razor_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_razor "github.com/tree-sitter/tree-sitter-razor/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_razor.Language())
	if language == nil {
		t.Errorf("Error loading Razor grammar")
	}
}
