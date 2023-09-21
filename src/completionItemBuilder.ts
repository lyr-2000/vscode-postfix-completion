import * as vscode from 'vscode'
import { adjustMultilineIndentation, getIndentCharacters, indent } from './utils/utils'
import { replaceExpr } from './replacer'

const COMPLETION_ITEM_TITLE = 'Postfix Complection'

export class CompletionItemBuilder {
  private item: vscode.CompletionItem
  private code: string
  private line: number
  private firstNonhitespaceCharacterIndex: number
  private delBeginIdx:number
  private lastDotIdx: number
  // private wordIdx: number
  constructor(name: string, inlineText: string, line: number, firstNonhitespaceCharacterIndex: number, dotIdx: number) {
    this.item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Snippet)
    this.item.detail = COMPLETION_ITEM_TITLE
    this.firstNonhitespaceCharacterIndex = firstNonhitespaceCharacterIndex
    // this.code = adjustMultilineIndentation(inlineText, 4)
    this.code = inlineText.substr(firstNonhitespaceCharacterIndex)
    this.line = line
    this.lastDotIdx = dotIdx
    this.delBeginIdx = firstNonhitespaceCharacterIndex
    // this.wordIdx = this.getWordIdx(this.code)
  }

  public static create = (label: string, inlineText: string, line: number, firstNonhitespaceCharacterIndex: number, dotIdx: number) => new CompletionItemBuilder(label, inlineText, line, firstNonhitespaceCharacterIndex, dotIdx)

  public description = (description: string) => {
    this.item.detail = this.item.detail + " (" + description + ")"
    return this
  }
  public command = (command: vscode.Command) => {
    this.item.command = command
    return this
  }

  public insertText = (insertText?: string) => {
    this.item.insertText = insertText
    return this
  }
  private getWordIdx(w: string): number {
    let d = w.lastIndexOf(' ')
    // if (d < 0) {
    //   return d
    // }
    // return w.substr(d+1)
    return d
  }
  private getInsertedText(replacement: string, escapedCode: string,isSnippets:boolean=false): string {
    // let firstState = replacement.replace(new RegExp('{{expr}}', 'g'), escapedCode).replace(new RegExp('{{indent}}', 'g'), getIndentCharacters())
    // let tmp = firstState.replace(new RegExp('{{word}}', 'g'), escapedCode.substring(this.wordIdx+1))
    // if (tmp != firstState && this.wordIdx > 0) {
    //   // update replace index 
    //   this.firstNonhitespaceCharacterIndex = this.wordIdx + 1
    //   return tmp
    // }
    // return firstState
    let str = replaceExpr(replacement, (keyword: string): string => {
      switch (keyword) {
        case "expr":
          return escapedCode
        case "indent":
          return indent();
        case "word":
          if(this.lastDotIdx == -1) {
            return escapedCode
          }
          let nonWhite = escapedCode.substring(this.firstNonhitespaceCharacterIndex,this.lastDotIdx)
          let lastSpace = nonWhite.lastIndexOf(' ')
          if (lastSpace == -1) {
            return escapedCode
          }
          this.delBeginIdx = Math.max(lastSpace+1,this.firstNonhitespaceCharacterIndex)
          return nonWhite.substring(lastSpace+1,nonWhite.length)
        default:
          return ""
      }
    })
    return str


  }
  public replace = (replacement: string, useSnippets?: boolean): CompletionItemBuilder => {
    if (useSnippets) {
      const escapedCode = this.code.replace('$', '\\$')
      this.item.insertText = new vscode.SnippetString(this.getInsertedText(replacement, escapedCode,useSnippets))
    } else {
      this.item.insertText = this.getInsertedText(replacement, this.code,useSnippets)
    }


    const rangeToDelete = new vscode.Range(
      new vscode.Position(this.line, this.delBeginIdx), // user.len =>  delete and send user
      new vscode.Position(this.line, this.lastDotIdx + 1) // accomodate 1 character for the dot
    )

    this.item.additionalTextEdits = [
      vscode.TextEdit.delete(rangeToDelete)
    ]

    return this
  }

  public example = (document: string): CompletionItemBuilder => {
    // this.item.documentation = document.replace(/{{expr}}/, this.code).replace(/{{indent}}/, indent())

    return this
  }

  public build = () => this.item
}
