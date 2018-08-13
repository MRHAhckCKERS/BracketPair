import { Position, Range } from "vscode";
import Bracket from "./bracket";
import ColorIndexes from "./IColorIndexes";
import Settings from "./settings";
import Token from "./token";

export default class SingularIndex implements ColorIndexes {
    private openBracketStack: Bracket[] = [];
    private closedBrackets: Bracket[] = [];
    private previousOpenBracketColorIndex: number = -1;
    private readonly settings: Settings;
    constructor(
        settings: Settings,
        previousState?: {
            currentOpenBracketColorIndexes: Bracket[],
            previousOpenBracketColorIndex: number,
        }) {

        this.settings = settings;

        if (previousState !== undefined) {
            this.openBracketStack = previousState.currentOpenBracketColorIndexes;
            this.previousOpenBracketColorIndex = previousState.previousOpenBracketColorIndex;
        }
    }

    public getPreviousIndex(type: string): number {
        return this.previousOpenBracketColorIndex;
    }

    public isClosingPairForCurrentStack(type: string, depth: number): boolean {
        if (this.openBracketStack.length === 0) {
            return false;
        }

        const topStack = this.openBracketStack[this.openBracketStack.length - 1];

        return topStack.token.type === type && topStack.token.depth === depth;
    }

    public setCurrent(token: Token, colorIndex: number) {
        this.openBracketStack.push(new Bracket(token, colorIndex, this.settings.colors[colorIndex]));
        this.previousOpenBracketColorIndex = colorIndex;
    }

    public getCurrentLength(type: string): number {
        return this.openBracketStack.length;
    }

    public getCurrentColorIndex(token: Token): number | undefined {
        const openBracket = this.openBracketStack.pop();
        if (openBracket) {
            const closeBracket = new Bracket(token, openBracket.colorIndex, openBracket.color);
            openBracket.pair = closeBracket;
            closeBracket.pair = openBracket;
            this.closedBrackets.push(closeBracket);

            return openBracket.colorIndex;
        }
    }

    public getEndScopeBracket(position: Position): Bracket | undefined {
        for (const closeBracket of this.closedBrackets) {
            const openBracket = closeBracket.pair!;
            const startPosition = new Position(openBracket.token.line.index, openBracket.token.endIndex);
            const endPosition = new Position(closeBracket.token.line.index, closeBracket.token.beginIndex);
            const range = new Range(startPosition, endPosition);

            if (range.contains(position)) {
                return closeBracket;
            }
        }
    }

    public clone() {
        return new SingularIndex(
            this.settings,
            {
                currentOpenBracketColorIndexes: this.openBracketStack.slice(),
                previousOpenBracketColorIndex: this.previousOpenBracketColorIndex,
            });
    }
}
