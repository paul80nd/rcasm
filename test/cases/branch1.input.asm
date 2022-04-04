; Testing jump to seen ref
back:
    ldi a,12
    ldi b,11
    mov c,a
    and
    bne back
    mov c,a
    ldi b,0
    cmp
    bne back
