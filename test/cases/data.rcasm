; disasm: debuginfo

        org 0x1000

nums:   dfb 254
        dfb 0xFE
        dfb 11111110b
        dfw 65244
        dfw 0xFEDC
        dfw 1111111011011100b

        clr a

nums2:  dfb 254, 253, 252
        dfb 254, 0xFE, 11111110b
        dfw 254, 0xFE, 0xFEDC

        clr b

str:    dfb "test"
        dfw "test"
        dfb "test", "ING"

        clr c

mix:    dfb 254, 0xFC, 10001100b, "ING"
