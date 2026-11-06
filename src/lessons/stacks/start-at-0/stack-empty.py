StackSize = 3
Stack = [""] * StackSize
TopPointer = 0


def Pop():
    global TopPointer
    if TopPointer == 0:
        print("Stack empty")
        return ""
    else:
        TopPointer = TopPointer - 1
        Item = Stack[TopPointer]
        return Item


# Main program
Removed = Pop()
print(Removed)
