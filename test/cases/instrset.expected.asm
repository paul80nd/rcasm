0000: 81           add
0001: 82           inc
0002: 84           orr
0003: 85           eor
0004: 85           eor
0005: 86           not
0006: 87           rol
0007: 81           add
0008: 82           inc
0009: 84           orr
000A: 85           eor
000B: 85           eor
000C: 86           not
000D: 87           rol
000E: 89           add d
000F: 8A           inc d
0010: 8C           orr d
0011: 8D           eor d
0012: 8D           eor d
0013: 8E           not d
0014: 8F           rol d
0015: E6 00 15     jmp
0018: E7 00 15     jsr
001B: A5           rts
001C: E2 00 15     bne
001F: E4 00 15     beq
0022: E8 00 15     bcs
0025: F0 00 15     blt
0028: F0 00 15     blt
002B: F4 00 15     ble
002E: 00           clr a
002F: 09           clr b
0030: 12           clr c
0031: 1B           clr d
0032: 24           clr m1
0033: 2D           clr m2
0034: 36           clr x
0035: 3F           clr y
0036: A1           clr xy
0037: 50           ldi a,-16
0038: 58           ldi a,-8
0039: 5F           ldi a,-1
003A: 40           ldi a,0
003B: 41           ldi a,1
003C: 47           ldi a,7
003D: 4F           ldi a,15
003E: 70           ldi b,-16
003F: 78           ldi b,-8
0040: 7F           ldi b,-1
0041: 60           ldi b,0
0042: 61           ldi b,1
0043: 67           ldi b,7
0044: 6F           ldi b,15
0045: AE           hlt
0046: AF           hlr
0047: AC           lds a
0048: AD           lds d
0049: 00           clr a
004A: 01           mov a,b
004B: 02           mov a,c
004C: 03           mov a,d
004D: 04           mov a,m1
004E: 05           mov a,m2
004F: 06           mov a,x
0050: 07           mov a,y
0051: 08           mov b,a
0052: 09           clr b
0053: 0A           mov b,c
0054: 0B           mov b,d
0055: 0C           mov b,m1
0056: 0D           mov b,m2
0057: 0E           mov b,x
0058: 0F           mov b,y
0059: 10           mov c,a
005A: 11           mov c,b
005B: 12           clr c
005C: 13           mov c,d
005D: 14           mov c,m1
005E: 15           mov c,m2
005F: 16           mov c,x
0060: 17           mov c,y
0061: 18           mov d,a
0062: 19           mov d,b
0063: 1A           mov d,c
0064: 1B           clr d
0065: 1C           mov d,m1
0066: 1D           mov d,m2
0067: 1E           mov d,x
0068: 1F           mov d,y
0069: 20           mov m1,a
006A: 21           mov m1,b
006B: 22           mov m1,c
006C: 23           mov m1,d
006D: 24           clr m1
006E: 25           mov m1,m2
006F: 26           mov m1,x
0070: 27           mov m1,y
0071: 28           mov m2,a
0072: 29           mov m2,b
0073: 2A           mov m2,c
0074: 2B           mov m2,d
0075: 2C           mov m2,m1
0076: 2D           clr m2
0077: 2E           mov m2,x
0078: 2F           mov m2,y
0079: 30           mov x,a
007A: 31           mov x,b
007B: 32           mov x,c
007C: 33           mov x,d
007D: 34           mov x,m1
007E: 35           mov x,m2
007F: 36           clr x
0080: 37           mov x,y
0081: 38           mov y,a
0082: 39           mov y,b
0083: 3A           mov y,c
0084: 3B           mov y,d
0085: 3C           mov y,m1
0086: 3D           mov y,m2
0087: 3E           mov y,x
0088: 3F           clr y
0089: A0           mov xy,m
008A: A1           clr xy
008B: A2           mov xy,j
008C: A3           mov xy,as
008D: A4           mov pc,m
008E: A5           rts
008F: A6           mov pc,j
0090: A7           mov pc,as
