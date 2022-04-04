import { opcodes_reverse_map, opcodes_reverse_class } from './opcodes';

function toHex8(v: number): string {
  return `${v.toString(16).toUpperCase().padStart(2, '0')}`;
}

function toHex16(v: number): string {
  return `${v.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * Returns an array with arrays of the given size.
 *
 * @param myArray {Array} array to split
 * @param chunk_size {Integer} Size of every group
 */
export function chunkArray<T>(myArray: T[], chunk_size: number) {
  var index = 0;
  var arrayLength = myArray.length;
  var tempArray = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    const myChunk = myArray.slice(index, index + chunk_size);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }

  return tempArray;
}

class Disassembler {
  private curAddr: number;
  private curOffs: number;
  private output: string[];
  private outputPadChars = '     ';
  private outputBytesPerLine = 1;

  private bytes: {
    startPC: number,
    bytes: number[]
  } = { startPC: 0, bytes: [] };

  constructor(private buf: Buffer) {
    this.output = [];
    this.curAddr = buf.readUInt8(0) + (buf.readUInt8(1) << 8);
    this.curOffs = 2;
  }

  byte = () => {
    const b = this.buf.readUInt8(this.curOffs);
    this.curOffs++;
    return b;
  };

  flushBytes() {
    const chunks = chunkArray(this.bytes.bytes, this.outputBytesPerLine);

    let pc = this.bytes.startPC;
    for (let i = 0; i < chunks.length; i++, pc += this.outputBytesPerLine) {
      const bytes = chunks[i];
      const bstr = bytes.map(b => toHex8(b)).join(' ');
      this.output.push(`${toHex16(pc)}: ${bstr}`);
    }
    this.bytes.bytes = [];
  }

  print = (addr: number, bytes: number[], decoded: string, cycle: string) => {
    this.flushBytes();
    const b0 = toHex8(bytes[0]);
    const b1 = bytes.length >= 2 ? toHex8(bytes[1]) : '  ';
    const b2 = bytes.length >= 3 ? toHex8(bytes[2]) : '  ';
    const line = `${toHex16(addr)}: ${b0} ${b1} ${b2}${this.outputPadChars}${decoded}`;
    this.output.push(line);
  };

  disSingle(decl: string, op: number, cls: { class: string; cycles: number; }) {
    const addr = this.curAddr;
    this.print(addr, [op], decl, cls.cycles.toString());
  }

  disTriple(decl: string, op: number, cls: { class: string; cycles: number; }) {
    const addr = this.curAddr;
    const hi = this.byte();
    const lo = this.byte();
    this.print(addr, [op, hi, lo], decl, /*label,*/ cls.cycles.toString());
  }

  disUnknown(op: number) {
    // Delay the string output of raw bytes so
    // that we can output multiple bytes per line
    if (this.bytes.bytes.length !== 0) {
      this.bytes.bytes.push(op);
    } else {
      this.bytes.bytes = [op];
      this.bytes.startPC = this.curAddr;
    }
  }

  disassemble() {
    const len = this.buf.byteLength;
    let isInsn = (addr: number) => true;

    let oldOffs = this.curOffs;
    while (this.curOffs < len) {
      this.curAddr += this.curOffs - oldOffs;
      oldOffs = this.curOffs;

      const op = this.byte();
      const decl = opcodes_reverse_map[(op & 0xF0) >> 4][(op & 0x0F)];

      if (decl !== null) {
        const cls = opcodes_reverse_class(op);
        if (cls.cycles == 3) {
          this.disTriple(decl, op, cls);
          continue;
        } else {
          this.disSingle(decl, op, cls);
          continue;
        }
      } else {
        this.disUnknown(op);
      }
    }
    this.flushBytes();
    return this.output;
  }

}

export function disassemble(prg: Buffer) {
  let disasm = new Disassembler(prg);
  return disasm.disassemble();
}
