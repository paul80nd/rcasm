0000: 24           clr m1
0001: 2E           mov m2,x
0002: 59           ldi a,-7
0003: 18           mov d,a
0004: 09           clr b
0005: 17           mov c,y
0006: 84           orr
0007: F0 00 0B     blt
000A: 2D           clr m2
000B: 0C           mov b,m1
000C: 87           rol
000D: 10           mov c,a
000E: 71           ldi b,-15
000F: 83           and
0010: 20           mov m1,a
0011: 0D           mov b,m2
0012: 86           not
0013: F0 00 19     blt
0016: 0C           mov b,m1
0017: 82           inc
0018: 20           mov m1,a
0019: 0D           mov b,m2
001A: 87           rol
001B: 10           mov c,a
001C: 71           ldi b,-15
001D: 83           and
001E: 28           mov m2,a
001F: 0F           mov b,y
0020: 87           rol
0021: 38           mov y,a
0022: 0F           mov b,y
0023: 86           not
0024: F0 00 34     blt
0027: 0D           mov b,m2
0028: 16           mov c,x
0029: 81           add
002A: 28           mov m2,a
002B: E8 00 31     bcs
002E: E6 00 34     jmp
0031: 0C           mov b,m1
0032: 82           inc
0033: 20           mov m1,a
0034: 0B           mov b,d
0035: 8A           inc d
0036: E2 00 0B     bne
0039: AE           hlt
