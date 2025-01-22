; Testing jumps relative to pc

        org 0x1234

        jmp *       ; infinte loop

        jmp *+3
foo:    clr a       ; should end up here
        jmp *-1     ; should jmp to foo
