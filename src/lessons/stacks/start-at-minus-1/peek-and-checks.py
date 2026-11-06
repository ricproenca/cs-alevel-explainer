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
print(IsEmpty())
Push("A")
print(Peek())
print(IsFull())
