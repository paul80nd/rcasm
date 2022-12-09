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
0045: C0 00 00     ldi m,
0048: C0 10 00     ldi m,
004B: C0 00 00     ldi m,
004E: C0 AB CD     ldi m,
0051: C0 FF FF     ldi m,
0054: C0 00 45     ldi m,
0057: E0 00 00     ldi j,
005A: E0 10 00     ldi j,
005D: E0 00 00     ldi j,
0060: E0 AB CD     ldi j,
0063: E0 FF FF     ldi j,
0066: E0 00 45     ldi j,
0069: AE           hlt
006A: AF           hlr
006B: AC           lds a
006C: AD           lds d
006D: 00           clr a
006E: 01           mov a,b
006F: 02           mov a,c
0070: 03           mov a,d
0071: 04           mov a,m1
0072: 05           mov a,m2
0073: 06           mov a,x
0074: 07           mov a,y
0075: 08           mov b,a
0076: 09           clr b
0077: 0A           mov b,c
0078: 0B           mov b,d
0079: 0C           mov b,m1
007A: 0D           mov b,m2
007B: 0E           mov b,x
007C: 0F           mov b,y
007D: 10           mov c,a
007E: 11           mov c,b
007F: 12           clr c
0080: 13           mov c,d
0081: 14           mov c,m1
0082: 15           mov c,m2
0083: 16           mov c,x
0084: 17           mov c,y
0085: 18           mov d,a
0086: 19           mov d,b
0087: 1A           mov d,c
0088: 1B           clr d
0089: 1C           mov d,m1
008A: 1D           mov d,m2
008B: 1E           mov d,x
008C: 1F           mov d,y
008D: 20           mov m1,a
008E: 21           mov m1,b
008F: 22           mov m1,c
0090: 23           mov m1,d
0091: 24           clr m1
0092: 25           mov m1,m2
0093: 26           mov m1,x
0094: 27           mov m1,y
0095: 28           mov m2,a
0096: 29           mov m2,b
0097: 2A           mov m2,c
0098: 2B           mov m2,d
0099: 2C           mov m2,m1
009A: 2D           clr m2
009B: 2E           mov m2,x
009C: 2F           mov m2,y
009D: 30           mov x,a
009E: 31           mov x,b
009F: 32           mov x,c
00A0: 33           mov x,d
00A1: 34           mov x,m1
00A2: 35           mov x,m2
00A3: 36           clr x
00A4: 37           mov x,y
00A5: 38           mov y,a
00A6: 39           mov y,b
00A7: 3A           mov y,c
00A8: 3B           mov y,d
00A9: 3C           mov y,m1
00AA: 3D           mov y,m2
00AB: 3E           mov y,x
00AC: 3F           clr y
00AD: A0           mov xy,m
00AE: A1           clr xy
00AF: A2           mov xy,j
00B0: A3           mov xy,as
00B1: A4           mov pc,m
00B2: A5           rts
00B3: A6           mov pc,j
00B4: A7           mov pc,as
