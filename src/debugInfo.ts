// Direct copy of https://github.com/nurpax/c64jasm/blob/master/src/debugInfo.ts minus multiple file support

const FastBitSet = require('fastbitset');

import { SourceLoc } from './ast';
import { Segment } from './segment';

type LineLoc = {
  lineNo: number;
  numBytes: number;
};

type LocPCEntry = { loc: LineLoc, pc: number, segmentId: number };

// Track code memory placement
export class DebugInfoTracker {
  lineStack: LocPCEntry[] = [];
  pcToLocs: { [pc: number]: LineLoc[] } = {};
  insnBitset = new FastBitSet();

  startLine(loc: SourceLoc, codePC: number, segment: Segment) {
    const l = {
      lineNo: loc.start.line,
      segmentId: segment.id,
      numBytes: 0
    };
    this.lineStack.push({ loc: l, pc: codePC, segmentId: segment.id });
  }

  endLine(curPC: number, curSegment: Segment) {
    const entry = this.lineStack.pop();
    if (!entry) {
      throw new Error('internal compiler error, mismatching start/end lines in debugInfo');
    }

    const numBytesEmitted = curPC - entry.pc;
    if (numBytesEmitted > 0 && curSegment.id === entry.segmentId) {
      const e = { ...entry.loc, numBytes: numBytesEmitted };
      if (this.pcToLocs[entry.pc] === undefined) {
        this.pcToLocs[entry.pc] = [e];
      } else {
        this.pcToLocs[entry.pc].push(e);
      }
    }
  }

  markAsInstruction(start: number, end: number) {
    for (let i = start; i < end; i++) {
      this.insnBitset.add(i);
    }
  }

  info() {
    const insnBitset = this.insnBitset.clone();
    const isInstruction = (addr: number) => {
      return insnBitset.has(addr);
    };

    return {
      pcToLocs: this.pcToLocs,
      isInstruction
    };
  }
}
