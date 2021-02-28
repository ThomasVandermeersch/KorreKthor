import numpy as np
emptyListe = [(1009, 1165), (1141, 1167), (1008, 1264), (1274, 1266), (1140, 1364), (1274, 1364), (1008, 1461), (1140, 1462), (1405, 1463), (1538, 1463), (1008, 1559), (1273, 1560)]
fullListe = [(1244, 1134), (1109, 1235), (977, 1333), (1243, 1431), (1110, 1529)]
minDistance = 50
jumpDistance = 100


xEmptyListe, yEmptyListe = zip(*emptyListe)
xFullListe, yFullListe = zip(*fullListe)

xMin = min(xEmptyListe + xFullListe)
xMax = max(xEmptyListe + xFullListe)
yMin = min(yEmptyListe + yFullListe)
yMax = max(yEmptyListe + yFullListe)

print(xMin, xMax)

sortedListe = emptyListe+fullListe
sortedListe.sort()

ySortedListe = list(yEmptyListe+yFullListe)
ySortedListe.sort()

xSortedListe2 = list(xEmptyListe+xFullListe)
xSortedListe2.sort()

boolArray = []
y = 0
c = 0
for i in ySortedListe:
    if abs(y-i) > minDistance:
        y = i
        sub = []
        if c:
            for i in range(c):
                sub.append(False)
            print(sub)
            boolArray.append(sub)
        c = 0
    c += 1

sub = []
for i in range(c):
    sub.append(False)
boolArray.append(sub)     

maxVal = 0
for i in boolArray:
    if len(i) > maxVal:
        maxVal = len(i)

for i in sortedListe:
    x = round(np.interp(i[0], [xMin, xMax], [1, maxVal])) - 1
    y = round(np.interp(i[1], [yMin, yMax], [1, len(boolArray)])) - 1

    if i in fullListe:
        boolArray[y][x] = True
        
print(boolArray)
    

# boolArray = []

# 
# x = 0

# for i in range(len(yListe)):
#     # if abs(y-yListe[i]) > minDistance:
#     #     y = yListe[i]
#     #     x = xListe[i]



#     for j in range(len(xListe)):
#         boolSubArray = []
#         if abs(y-yListe[j]) < minDistance:
#             if abs(x-xListe[j]) < jumpDistance and abs(x-xListe[j]) > minDistance:
#                 # le point cercle correspond
#                 if yListe[j] 
        