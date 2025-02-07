    ORG 0xFEDC

; Testing jump between refs in higher mem

    ldi a,12
    ldi b,11
earlier:
    mov c,a
    and
    bne earlier
    beq later
    mov c,a
later:
    ldi b,0
    cmp
 