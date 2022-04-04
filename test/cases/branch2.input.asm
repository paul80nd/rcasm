; Testing jump to later ref
    ldi a,12
    ldi b,11
    mov c,a
    and
    bne test
    mov c,a
test:
    ldi b,0
    cmp
 