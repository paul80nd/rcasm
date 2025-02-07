; nested scopes

foo: {
scope1: {
    jmp _local_label
_local_label:
}
_baz: {
    add
    bne _local_label
_local_label: ; this should be ok
    jmp _local_label
}
    rts
}

    jsr foo