QueueSize = 3
Queue = [""] * QueueSize
HeadPointer = 0
TailPointer = -1
NumberItems = 0


def Enqueue(Item):
    global TailPointer
    global NumberItems
    if TailPointer == QueueSize - 1:
        print("Queue full")
    else:
        TailPointer = TailPointer + 1
        Queue[TailPointer] = Item
        NumberItems = NumberItems + 1


def Dequeue():
    global HeadPointer
    global NumberItems
    if NumberItems == 0:
        print("Queue empty")
        return ""
    else:
        Item = Queue[HeadPointer]
        HeadPointer = HeadPointer + 1
        NumberItems = NumberItems - 1
        return Item


def Peek():
    if NumberItems == 0:
        return ""
    else:
        return Queue[HeadPointer]


def IsEmpty():
    if NumberItems == 0:
        return True
    else:
        return False


def IsFull():
    if TailPointer == QueueSize - 1:
        return True
    else:
        return False


# Main program
Enqueue("A")
Enqueue("B")
Enqueue("C")
Enqueue("D")
