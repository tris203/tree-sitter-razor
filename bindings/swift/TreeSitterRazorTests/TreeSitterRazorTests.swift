import XCTest
import SwiftTreeSitter
import TreeSitterRazor

final class TreeSitterRazorTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_razor())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Razor grammar")
    }
}
