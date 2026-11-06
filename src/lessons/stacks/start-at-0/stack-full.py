StackSize = 3
Stack = ["A", "B", "C"]
TopPointer = 3


def Push(Item):
    global TopPointer
    if TopPointer == StackSize:
        print("Stack full")
    else:
        Stack[TopPointer] = Item
        TopPointer = TopPointer + 1


# Main program
Push("D")
