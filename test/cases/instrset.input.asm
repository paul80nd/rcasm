; Testing instruction set

alus:

    add
    inc
    orr
    eor
    cmp
    not
    rol

    add a
    inc a
    orr a
    eor a
    cmp a
    not a
    rol a
       
    add d
    inc d
    orr d
    eor d
    cmp d
    not d
    rol d

clears:
    
    clr a
    clr b
    clr c
    clr d
    clr m1
    clr m2
    clr x
    clr y

    clr xy

load8s:

    ldi a,-16
    ldi a,-8
    ldi a,-1
    ldi a,0
    ldi a,1
    ldi a,7
    ldi a,15

    ldi b,-16
    ldi b,-8
    ldi b,-1
    ldi b,0
    ldi b,1
    ldi b,7
    ldi b,15

miscs:

    hlt
    hlr
    lds a
    lds d

move8s:

    mov a,a
    mov a,b
    mov a,c
    mov a,d
    mov a,m1
    mov a,m2
    mov a,x
    mov a,y

    mov b,a
    mov b,b
    mov b,c
    mov b,d
    mov b,m1
    mov b,m2
    mov b,x
    mov b,y

    mov c,a
    mov c,b
    mov c,c
    mov c,d
    mov c,m1
    mov c,m2
    mov c,x
    mov c,y

    mov d,a
    mov d,b
    mov d,c
    mov d,d
    mov d,m1
    mov d,m2
    mov d,x
    mov d,y

    mov m1,a
    mov m1,b
    mov m1,c
    mov m1,d
    mov m1,m1
    mov m1,m2
    mov m1,x
    mov m1,y

    mov m2,a
    mov m2,b
    mov m2,c
    mov m2,d
    mov m2,m1
    mov m2,m2
    mov m2,x
    mov m2,y

    mov x,a
    mov x,b
    mov x,c
    mov x,d
    mov x,m1
    mov x,m2
    mov x,x
    mov x,y

    mov y,a
    mov y,b
    mov y,c
    mov y,d
    mov y,m1
    mov y,m2
    mov y,x
    mov y,y

    mov xy,m
    mov xy,xy
    mov xy,j
    mov xy,as

    mov pc,m
    mov pc,xy
    mov pc,j
    mov pc,as
