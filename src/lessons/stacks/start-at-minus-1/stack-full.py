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


def Peek():
    if TopPointer == -1:
        return ""
    else:
        return Stack[TopPointer]


def IsEmpty():
    if TopPointer == -1:
        return True
    else:
        return False


def IsFull():
    if TopPointer == StackSize - 1:
        return True
    else:
        return False


# Main program
Push("A")
Push("B")
Push("C")
Push("D")
