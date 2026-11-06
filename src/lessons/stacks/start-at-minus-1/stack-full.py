StackSize = 3
Stack = ["A", "B", "C"]
TopPointer = 2


def Push(Item):
    global TopPointer
    if TopPointer == StackSize - 1:
        print("Stack full")
    else:
        TopPointer = TopPointer + 1
        Stack[TopPointer] = Item


# Main program
Push("D")
