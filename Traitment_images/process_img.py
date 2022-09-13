import numpy as np
import cv2

# import glob
# import matplotlib.pyplot as plt
import math
from pyzbar.pyzbar import decode
import json

import pprint

# from coords import coords


def process(imgPath, copylayout,versionID):
    """
    This function takes an image path and return the equivalent answers boolean array is the image is conform else None.
    The image is conform if there are 3 squares on each bottom left, top left and top right corners.
    """
    print(imgPath)
    img_rgb = cv2.imread(imgPath)
    img = cv2.cvtColor(img_rgb, cv2.COLOR_BGR2GRAY)
    img[img < 170] = 0
    # ratio = img.shape[1] / 1191
    # img = cv2.resize(img, (1191, round(img.shape[0] / ratio)), interpolation=cv2.INTER_LINEAR)
    print(f"img shape: {img.shape}")

    goodPage = isGoodPage(img)
    # print(f" {imgPath}")
    print("goodpage", goodPage)

    if goodPage:  # Check the 3 sheet corners
        img, new_markers_pos = getGoodOrientation(
            img,
            goodPage,
        )
        # cv2.imshow("img", img)
        # cv2.waitKey(delay=0)
        # img = cv2.rotate(img, cv2.ROTATE_180)
    markers = [[x +25 , y+25 ] for x, y in copylayout["markers"]]
    markers = np.float32(sorted(markers))
    # markers have to be shifted because the coordinates are the top left
    # corner, but we detect the center of the marker in the orientation func

    new_markers_pos = np.float32(sorted(new_markers_pos))
    print("markers:", new_markers_pos, markers)

    transform_matrix = cv2.getAffineTransform(markers, new_markers_pos)
    print(" mat:", transform_matrix)

    coords = copylayout["versions"][versionID]
    # cv2.transform(np.float32(copylayout["versions"]["X"][1]), coords, transform_matrix)
    # print("coor", coords)
    c = (
        round(transform_matrix[0, 0] * 140 + transform_matrix[0, 1] * 75 + transform_matrix[0, 2]),
        round(transform_matrix[1, 0] * 140 + transform_matrix[1, 1] * 75 + transform_matrix[1, 2]),
    )
    cv2.rectangle(img, c, (round(c[0] + 50), round(c[1] + 50)), (0, 100, 0), 1)
    # c = (0,0)
    # cv2.rectangle(img, c, (round(c[0] + 50), round(c[1] + 50)), (0, 100, 0), 1)

    circle_size = copylayout["circle_size"]
    resp = []
    for list_c in coords:
        resp.append([])
        for c in list_c:
            # print("cord:", c)
            c = (
                round(
                    transform_matrix[0, 0] * c[0] + transform_matrix[0, 1] * c[1] + transform_matrix[0, 2] 
                ),
                round(
                    transform_matrix[1, 0] * c[0] + transform_matrix[1, 1] * c[1] + transform_matrix[1, 2]
                ),
            )
            # print("transform cord:", c)

            bl = getBlackIntensity(img, c, (circle_size, circle_size))
            # print(bl)
            if bl >= 0.17:  # Box clearly ticked
                resp[-1].append(1)
                cv2.circle(
                    img,
                    (round(c[0] + circle_size / 2), round(c[1] + circle_size / 2)),
                    round(40 / 2),
                    (0, 100, 0),
                    1,
                )
            elif bl < 0.17 and bl > 0.15:  # box not clearly ticked -> uncertain
                resp[-1].append(2)
            else:  # bl <= 0.145
                resp[-1].append(0)  # box clearly unticked
                cv2.rectangle(img, c, (round(c[0] + circle_size), round(c[1] + circle_size)), (0, 100, 0), 1)
            # cv2.imshow("img", img)
            # cv2.waitKey(delay=500)

    # resp = getImageResponses(img)

    # cv2.imshow("img", img)
    # cv2.waitKey(delay=5000)
    # cv2.destroyAllWindows()

    if resp:
        cv2.imwrite(imgPath, img)
        return resp

    return None


def getBlackIntensity(img, pos, size):
    part = img[pos[1] : pos[1] + size[1], pos[0] : pos[0] + size[0]]
    # pprint.pprint(part)
    return 1 - (np.mean(part) / 255)


def isGoodPage(img, squaresTemplatePath="source_pdf/squares.PNG", threshold=0.8):
    """
    This function checks is the povided image can be analysed (this means it has 3 templates: TL, TR, BL).
    If yes returns the squares points list else None.
    - The img is the image you want to check
    - The squaresTemplatePath param is the locaiton to the squares template
    - The threshold param is the resemblance ratio between the squares template and a block in the image
    """
    template = cv2.imread(squaresTemplatePath, 0)
    # template = cv2.resize(template, (60, 60), interpolation=cv2.INTER_LINEAR)

    # cv2.imshow("img", template)
    # cv2.waitKey(delay=5000)
    # cv2.destroyAllWindows()
    # cv2.imshow("img", img)
    # cv2.waitKey(delay=5000)
    # cv2.destroyAllWindows()

    res = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
    loc = np.where(res >= threshold)

    w, h = template.shape[::-1]
    minDistance = math.sqrt(w**2 + h**2)

    # This loop returns a list with 3 points that matches the squares
    point_groups = []
    for pt in zip(*loc[::-1]):
        to_add = True
        for points in point_groups:
            for point in points:
                distance = math.sqrt(((pt[0] - point[0]) ** 2) + ((pt[1] - point[1]) ** 2))
                if distance < minDistance:
                    to_add = False
                    points.append(pt)
                    break
            if not to_add:
                break

        if to_add:
            point_groups.append([pt])

    mean_points = []
    for points in point_groups:
        mean_points.append((round(np.mean([x[0] for x in points])+25), round(np.mean([x[1] for x in points])+25)))
        # 25 offset becaseu it is half of marker_template shape to get center of
        # marker as ref

    # print(mean_points)

    # for pt in mean_points:
        # cv2.rectangle(img, pt, (pt[0] + w, pt[1] + h), (0, 255, 0), 5)
    # cv2.imshow("img", img)
    # cv2.waitKey()
    # cv2.destroyAllWindows()
    if len(mean_points) == 3:
        return mean_points

    print(f"Not a good page: {point_groups}")
    return False


def getGoodOrientation(img, squaresLocations):
    """
    Function that returns the warped image based on the trasnformation with the detected squares
    - The img param is the image to get the orientation
    - The squaresLocations param is the locations of the squares
    - The margin param is the limit ratio for the squares positions on bottom right
    """

    points1 = squaresLocations
    points2 = []
    # the 2 further points are the diagonal
    dist = 0
    pair_max = (0, 0)
    for i, pt1 in enumerate(points1):
        for j, pt2 in enumerate(points1):
            dist_n = math.sqrt(((pt1[0] - pt2[0]) ** 2) + ((pt1[1] - pt2[1]) ** 2))
            if dist_n > dist:
                dist = dist_n
                pair_max = (i, j)
    rest_point = [i for i, p in enumerate(points1) if not i in pair_max][0]

    diag_down = ()
    dist2 = 0
    for pt in (pair_max[0], pair_max[1]):
        dist_n = math.sqrt(
            ((points1[pt][0] - points1[rest_point][0]) ** 2) + ((points1[pt][1] - points1[rest_point][1]) ** 2)
        )
        if dist_n > dist2:
            dist2 = dist_n
            diag_down = pt

    img_size = img.shape[::-1]
    for i, pt1 in enumerate(points1):
        if i == rest_point:
            # points2.append((1000, 1500))
            points2.append((img_size))

        elif i == diag_down:
            # points2.append((1000, 0))
            points2.append((img_size[0], 0))
        else:
            # points2.append((0, 1500))
            points2.append((0, img_size[1]))

    nppoints1 = np.float32(points1)
    nppoints2 = np.float32(points2)
    # print("p1: ", points1, " p2: ", points2)

    h = cv2.getAffineTransform(nppoints1, nppoints2)
    # Use homography
    # imgReg = cv2.warpAffine(img, h, (1000, 1500))
    imgReg = cv2.warpAffine(img, h, img_size)

    return imgReg, points2


def getImageResponses(
    img,
    fullTemplatePath="source_pdf/rempli.PNG",
    fullThreshold=0.5,
    emptyTemplatePath="source_pdf/vide.PNG",
    emptyThreshold=0.5,
):
    """
    Function that returns a boolean list of selected response in the provided image. True is selected else False.
    - The img param is the image you want to get the answers
    - The fullTemplatePath param is the fuff template source path
    - The fullThreshold param is the resemblance ratio between the full template and a block in the image
    - The emptyTemplatePath param is the empty template source path
    - The emptyThreshold param is the resemblance ratio between the empty template and a block in the image
    """
    emptyTemplate = cv2.imread(emptyTemplatePath, 0)
    emptyTemplate = cv2.resize(emptyTemplate, (25, 25), interpolation=cv2.INTER_LINEAR)

    # cv2.imshow("img", emptyTemplate)
    # cv2.waitKey(delay=5000)
    # cv2.destroyAllWindows()
    # cv2.imshow("img", img)
    # cv2.waitKey(delay=5000)
    # cv2.destroyAllWindows()

    fullTemplate = cv2.imread(fullTemplatePath, 0)
    fullTemplate = cv2.resize(fullTemplate, (25, 25), interpolation=cv2.INTER_LINEAR)

    # cv2.imshow("img", fullTemplate)
    # cv2.waitKey(delay=5000)
    # cv2.destroyAllWindows()

    emptyList = getPatternList(img, emptyTemplate, emptyThreshold, 25, fullTemplate)
    fullList = getPatternList(img, fullTemplate, fullThreshold, 35, fullTemplate)

    pprint.pprint(emptyList + fullList)

    w, h = fullTemplate.shape[::-1]

    for i in fullList:
        i = (i[0] + 200, i[1] + 290)  # replace the matched points in the area
        img[i[1] : i[1] + 25, i[0] : i[0] + 25] = fullTemplate
        cv2.circle(img, (round(i[0] + w / 2), round(i[1] + h / 2)), round(w / 2), (0, 255, 0), 1)

    for i in emptyList:
        i = (i[0] + 200, i[1] + 290)  # replace the matched points in the area
        # img[i[1] : i[1] + 25, i[0] : i[0] + 25] = emptyTemplate
        cv2.rectangle(img, i, (round(i[0] + (w * (2 / 3))), round(i[1] + (h * (2 / 3)))), (0, 100, 0), 1)

    # cv2.rectangle(img, (120, 200), (1000, 1550), (0,100,0), 1) # Display the matching area

    boolArray = getBoolArray(emptyList, fullList, 25)
    return boolArray


def getPatternList(img, template, threshold, minDistance, mask):
    """
    This function returns a list where the templates are detected in pixels.
    - The thresold param is the resemblance ratio
    - The minDistance param is the minimal distance between 2 "same" point
    """

    # img[120:1550, 200:1000] : define the matching area
    area = img[290:1550, 200:1100]
    # area[area < 30] = 0
    # area[area > 150] = 255
    result = cv2.matchTemplate(area, template, cv2.TM_CCOEFF_NORMED, np.invert(mask))
    # result = cv2.matchTemplate(area, template, cv2.TM_CCOEFF_NORMED)
    # print(np.invert(template))

    location = np.where(result >= threshold)

    # cv2.imshow("img", np.invert(mask))
    cv2.imshow("img", area)
    cv2.waitKey()

    liste = []

    for pt in zip(*location[::-1]):
        if len(liste) == 0:
            liste.append(pt)

        if pt not in liste:
            same = 0

            for i in liste:
                xdiff = abs(i[0] - pt[0])
                ydiff = abs(i[1] - pt[1])

                # If the pt is near a point in the all liste -> don't add the point
                if (xdiff < minDistance) and (ydiff < minDistance):
                    same += 1

            if same == 0:
                liste.append(pt)

    return liste


def getBoolArray(emptyList, fullList, minDistance):
    """
    This function returns the boolean list with True where there is a full circle else False.
    - The emptyList param is a list with empty cicle coordinates
    - The fullList param is a list with full cicle coordinates
    - The minDistance param is the minimal distance between 2 same point

    This function returns None if th emptyListe and fullListe are empty.
    """
    if len(emptyList) == 0 and len(fullList) == 0:
        return None

    # xEmptyList, yEmptyList = zip(*emptyList) if len(emptyList) > 0 else [(), ()]
    # xFullList, yFullList = zip(*fullList) if len(fullList) > 0 else [(), ()]

    # xMin = min(xEmptyList + xFullList)
    # xMax = max(xEmptyList + xFullList)
    # yMin = min(yEmptyList + yFullList)
    # yMax = max(yEmptyList + yFullList)
    emptyList = [(x, False) for x in emptyList]
    fullList = [(x, True) for x in fullList]

    sortedList = emptyList + fullList
    sortedList.sort(key=lambda x: x[0][::-1])

    boolArray = [[sortedList[0]]]
    for i in range(1, len(sortedList)):
        if abs(sortedList[i][0][1] - sortedList[i - 1][0][1]) > minDistance:
            # if abs(element[1] - prev_el[1]) > minDistance:
            boolArray[-1].sort(key=lambda x: x[0][0])
            boolArray.append([sortedList[i]])
        else:
            boolArray[-1].append(
                sortedList[i],
            )

    boolArray[-1].sort(key=lambda x: x[0][0])
    # print(boolArray)
    boolArray = [[i[1] for i in x] for x in boolArray]

    # ySortedList = list(yEmptyList + yFullList)
    # ySortedList.sort()

    # # This ugly part creates the boolArray liste and fills in with False
    # boolArray = []
    # y = 0
    # c = 0
    # for i in ySortedList:
    #     if abs(y - i) > minDistance:
    #         y = i
    #         sub = []
    #         if c:
    #             for i in range(c):
    #                 sub.append(False)
    #             boolArray.append(sub)
    #         c = 0
    #     c += 1

    # sub = []
    # for i in range(c):
    #     sub.append(False)
    # boolArray.append(sub)

    # # get the size of the biggest liste in the boolArray
    # maxVal = len(max(boolArray, key=lambda i: len(i)))

    # for i in sortedList:
    #     # x is interpolated between xMin and xMax -> estimation where the point i[0] is on the question line
    #     vx = np.interp(i[0], [xMin, xMax], [1, maxVal])
    #     x = round(vx) - 1
    #     # y is interpolated between yMin and yMax -> estimation where the question line is
    #     vy = np.interp(i[1], [yMin, yMax], [1, len(boolArray)])
    #     y = round(vy) - 1

    #     if i in fullList:
    #         x = len(boolArray[y]) - 1 if x >= len(boolArray[y]) - 1 else x
    #         boolArray[y][x] = True

    return boolArray


# Display barcode and QR code location
def display(im, bbox):
    n = len(bbox)
    for j in range(n):
        cv2.line(im, tuple(bbox[j][0]), tuple(bbox[(j + 1) % n][0]), (255, 0, 0), 3)

    # Display results
    cv2.imshow("Results", im)


def decodeQRCode(imagePath):
    img = cv2.imread(imagePath)
    # img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # ratio = img.shape[1] / 1191
    # img = cv2.resize(img, (1191, round(img.shape[0] / ratio)), interpolation=cv2.INTER_LINEAR)
    qrcode = None
    preQRCode = decode(img)

    if len(preQRCode) == 0:  # One more chance to get the QRCode
        img = img[0:500, 0:500]
        preQRCode = decode(img)

        if len(preQRCode) == 0:
            return None

    try:
        try:
            qrcode = json.loads(preQRCode[0].data)
            if qrcode['version'] == 'noVersion':
                qrcode['version'] = 'X'
        except:
            qr = preQRCode[0].data.decode("utf-8") 
            data = qr.split(";")
            qrcode = {"matricule": data[0], "version": data[1], "lessonId": data[2]}
    except Exception as e:
        print(e)
        raise
        # return None

    return qrcode
