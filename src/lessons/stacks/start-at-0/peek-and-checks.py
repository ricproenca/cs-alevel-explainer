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


def Peek():
    if TopPointer == 0:
        return ""
    else:
        return Stack[TopPointer - 1]


def IsEmpty():
    if TopPointer == 0:
        return True
    else:
        return False


def IsFull():
    if TopPointer == StackSize:
        return True
    else:
        return False


# Main program
print(IsEmpty())
Push("A")
print(Peek())
print(IsFull())
