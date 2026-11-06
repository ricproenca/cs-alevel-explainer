StackSize = 3
Stack = [""] * StackSize
TopPointer = 0


def Push(Item):
    global TopPointer
    if TopPointer == StackSize:
        print("Stack full")
    else:
        Stack[TopPointer] = Item
        TopPointer = TopPointer + 1


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
Push("A")
Push("B")
Removed = Pop()
print(Removed)
Push("C")
