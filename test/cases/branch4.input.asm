    ORG 0xFEDC

; Testing subroutine and return

    ldi a,12
    ldi b,11
    mov c,a
    and
    jsr sub
    hlt

sub:
    and
    rts
 