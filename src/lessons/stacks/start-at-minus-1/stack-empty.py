StackSize = 3
Stack = [""] * StackSize
TopPointer = -1


def Pop():
    global TopPointer
    if TopPointer == -1:
        print("Stack empty")
        return ""
    else:
        Item = Stack[TopPointer]
        TopPointer = TopPointer - 1
        return Item


# Main program
Removed = Pop()
print(Removed)
