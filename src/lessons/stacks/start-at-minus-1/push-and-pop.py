StackSize = 3
Stack = [""] * StackSize
TopPointer = -1


def Push(Item):
    global TopPointer
    if TopPointer == StackSize - 1:
        print("Stack full")
    else:
        TopPointer = TopPointer + 1
        Stack[TopPointer] = Item


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
Push("A")
Push("B")
Removed = Pop()
print(Removed)
Push("C")
