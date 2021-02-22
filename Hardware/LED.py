### Run as SUDO

import board
import neopixel
import time

pixel = neopixel.NeoPixel(board.D18, 60, pixel_order=neopixel.RGBW)
for i in range(60):
    pixel[i] = (250, 250, 250, 0)
# time.sleep(1)
# for i in range(60):
#     pixel[i] = (100, 0, 0, 0)
