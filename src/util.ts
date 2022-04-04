// Selective copy of https://github.com/nurpax/c64jasm/blob/master/src/util.ts

export function toHex16(v: number): string {
    return v.toString(16).padStart(4, '0');
}
