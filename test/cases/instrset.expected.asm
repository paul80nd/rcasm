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
0037: 19           mov d,b
0038: 81           add
0039: 6F           ldi b,15
003A: E6 01 AA     jmp
003D: 50           ldi a,-16
003E: 58           ldi a,-8
003F: 5F           ldi a,-1
0040: 40           ldi a,0
0041: 41           ldi a,1
0042: 47           ldi a,7
0043: 4F           ldi a,15
0044: 70           ldi b,-16
0045: 78           ldi b,-8
0046: 7F           ldi b,-1
0047: 60           ldi b,0
0048: 61           ldi b,1
0049: 67           ldi b,7
004A: 6F           ldi b,15
004B: C0 00 00     ldi m
004E: C0 10 00     ldi m
0051: C0 00 00     ldi m
0054: C0 AB CD     ldi m
0057: C0 FF FF     ldi m
005A: C0 00 4B     ldi m
005D: E0 00 00     ldi j
0060: E0 10 00     ldi j
0063: E0 00 00     ldi j
0066: E0 AB CD     ldi j
0069: E0 FF FF     ldi j
006C: E0 00 4B     ldi j
006F: 90           ldr a
0070: 91           ldr b
0071: 92           ldr c
0072: 93           ldr d
0073: 98           str a
0074: 99           str b
0075: 9A           str c
0076: 9B           str d
0077: AE           hlt
0078: AF           hlr
0079: AC           lds a
007A: AD           lds d
007B: 00           clr a
007C: 01           mov a,b
007D: 02           mov a,c
007E: 03           mov a,d
007F: 04           mov a,m1
0080: 05           mov a,m2
0081: 06           mov a,x
0082: 07           mov a,y
0083: 08           mov b,a
0084: 09           clr b
0085: 0A           mov b,c
0086: 0B           mov b,d
0087: 0C           mov b,m1
0088: 0D           mov b,m2
0089: 0E           mov b,x
008A: 0F           mov b,y
008B: 10           mov c,a
008C: 11           mov c,b
008D: 12           clr c
008E: 13           mov c,d
008F: 14           mov c,m1
0090: 15           mov c,m2
0091: 16           mov c,x
0092: 17           mov c,y
0093: 18           mov d,a
0094: 19           mov d,b
0095: 1A           mov d,c
0096: 1B           clr d
0097: 1C           mov d,m1
0098: 1D           mov d,m2
0099: 1E           mov d,x
009A: 1F           mov d,y
009B: 20           mov m1,a
009C: 21           mov m1,b
009D: 22           mov m1,c
009E: 23           mov m1,d
009F: 24           clr m1
00A0: 25           mov m1,m2
00A1: 26           mov m1,x
00A2: 27           mov m1,y
00A3: 28           mov m2,a
00A4: 29           mov m2,b
00A5: 2A           mov m2,c
00A6: 2B           mov m2,d
00A7: 2C           mov m2,m1
00A8: 2D           clr m2
00A9: 2E           mov m2,x
00AA: 2F           mov m2,y
00AB: 30           mov x,a
00AC: 31           mov x,b
00AD: 32           mov x,c
00AE: 33           mov x,d
00AF: 34           mov x,m1
00B0: 35           mov x,m2
00B1: 36           clr x
00B2: 37           mov x,y
00B3: 38           mov y,a
00B4: 39           mov y,b
00B5: 3A           mov y,c
00B6: 3B           mov y,d
00B7: 3C           mov y,m1
00B8: 3D           mov y,m2
00B9: 3E           mov y,x
00BA: 3F           clr y
00BB: A0           mov xy,m
00BC: A1           clr xy
00BD: A2           mov xy,j
00BE: A3           mov xy,as
00BF: A4           mov pc,m
00C0: A5           rts
00C1: A6           mov pc,j
00C2: A7           mov pc,as
