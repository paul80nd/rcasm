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
0015: 00           clr a
0016: 09           clr b
0017: 12           clr c
0018: 1B           clr d
0019: 24           clr m1
001A: 2D           clr m2
001B: 36           clr x
001C: 3F           clr y
001D: A1           clr xy
001E: 50           ldi a,-16
001F: 58           ldi a,-8
0020: 5F           ldi a,-1
0021: 40           ldi a,0
0022: 41           ldi a,1
0023: 47           ldi a,7
0024: 4F           ldi a,15
0025: 70           ldi b,-16
0026: 78           ldi b,-8
0027: 7F           ldi b,-1
0028: 60           ldi b,0
0029: 61           ldi b,1
002A: 67           ldi b,7
002B: 6F           ldi b,15
002C: AE           hlt
002D: AF           hlr
002E: AC           lds a
002F: AD           lds d
0030: 00           clr a
0031: 01           mov a,b
0032: 02           mov a,c
0033: 03           mov a,d
0034: 04           mov a,m1
0035: 05           mov a,m2
0036: 06           mov a,x
0037: 07           mov a,y
0038: 08           mov b,a
0039: 09           clr b
003A: 0A           mov b,c
003B: 0B           mov b,d
003C: 0C           mov b,m1
003D: 0D           mov b,m2
003E: 0E           mov b,x
003F: 0F           mov b,y
0040: 10           mov c,a
0041: 11           mov c,b
0042: 12           clr c
0043: 13           mov c,d
0044: 14           mov c,m1
0045: 15           mov c,m2
0046: 16           mov c,x
0047: 17           mov c,y
0048: 18           mov d,a
0049: 19           mov d,b
004A: 1A           mov d,c
004B: 1B           clr d
004C: 1C           mov d,m1
004D: 1D           mov d,m2
004E: 1E           mov d,x
004F: 1F           mov d,y
0050: 20           mov m1,a
0051: 21           mov m1,b
0052: 22           mov m1,c
0053: 23           mov m1,d
0054: 24           clr m1
0055: 25           mov m1,m2
0056: 26           mov m1,x
0057: 27           mov m1,y
0058: 28           mov m2,a
0059: 29           mov m2,b
005A: 2A           mov m2,c
005B: 2B           mov m2,d
005C: 2C           mov m2,m1
005D: 2D           clr m2
005E: 2E           mov m2,x
005F: 2F           mov m2,y
0060: 30           mov x,a
0061: 31           mov x,b
0062: 32           mov x,c
0063: 33           mov x,d
0064: 34           mov x,m1
0065: 35           mov x,m2
0066: 36           clr x
0067: 37           mov x,y
0068: 38           mov y,a
0069: 39           mov y,b
006A: 3A           mov y,c
006B: 3B           mov y,d
006C: 3C           mov y,m1
006D: 3D           mov y,m2
006E: 3E           mov y,x
006F: 3F           clr y
0070: A0           mov xy,m
0071: A1           clr xy
0072: A2           mov xy,j
0073: A3           mov xy,as
0074: A4           mov pc,m
0075: A5           rts
0076: A6           mov pc,j
0077: A7           mov pc,as
