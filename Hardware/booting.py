import RPi.GPIO as GPIO
import time
import os
import board
import neopixel
from time import sleep

button_shutdown = 14 #to define
GPIO.setup(button_shutdown,GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

button_play = 15 #define
GPIO.setup(button_play,GPIO.IN, pull_up_down=GPIO.PUD_DOWN)

button_add = 24#define
GPIO.setup(button_add, GPIO.IN, pull_up_down = GPIO.PUD_DOWN)

button_sub = 23 #define
GPIO.setup(button_sub, GPIO.IN, pull_up_down = GPIO.PUD_DOWN)

brightness = 1.0
past_brightness = brightness = 1.0
past_brightness = 1.0

buzzer = 12
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(buzzer, GPIO.OUT)
GPIO.output(buzzer,True)

pins = (1, 7 , 8)
global pwmR, pwmG, pwmB
for i in pins:  # iterate on the RGB pins, initialize each and set to HIGH to turn it off (COMMON ANODE)
    print(i)
    GPIO.setup(i, GPIO.OUT)

pwmR = GPIO.PWM(pins[0], 2000)  # set each PWM pin to 2 KHz
pwmG = GPIO.PWM(pins[1], 2000)
pwmB = GPIO.PWM(pins[2], 2000)
pwmR.start(0)   # initially set to 0 duty cycle
pwmG.start(0)
pwmB.start(0)

pwmR.ChangeDutyCycle(0)
pwmG.ChangeDutyCycle(100)
pwmB.ChangeDutyCycle(0)

play = False


for i in range (3) :
    for time in range (100):
        GPIO.output(buzzer,True)
        sleep(0.00005)
        GPIO.output(buzzer, False)
        sleep(0.00005)
        time +=1
    sleep(0.3)
    
    i+=1


def Shutdown():
    os.system("sudo shutdown -h now")
    

def Play_scanner():
    #     selection.run()
    
    if play == False :
        for i in range (2) :
            for time in range (1000):
                GPIO.output(buzzer,True)
                sleep(0.00005)
                GPIO.output(buzzer, False)
                sleep(0.00005)
                time +=1
            sleep(0.3)
            
            i+=1
        pwmR.ChangeDutyCycle(100)
        pwmG.ChangeDutyCycle(100)
        pwmB.ChangeDutyCycle(0)


        os.system("sudo python3 ./selection.py")



def AddBrightness(brightness,past_brightness):
    if brightness <= 0.9 :
        past_brightness = brightness
        brightness  += 0.1
    return brightness, past_brightness
    

def SubBrightness(brightness,past_brightness):
    if brightness >= 0.1 :
        past_brightness = brightness
        brightness  -= 0.1
    return (brightness, past_brightness)


while(1):

#     GPIO.add_event_detect(button_shutdown, GPIO.FALLING, callback=Shutdown, bouncetime=2000)
# 
#     GPIO.add_event_detect(button_play, GPIO.FALLING, callback=Play_scanner, bouncetime=2000)
# 
#     GPIO.add_event_detect(button_add, GPIO.FALLING, callback=AddBrightness, bouncetime=2000)
# 
#     GPIO.add_event_detect(button_sub, GPIO.FALLING, callback=SubBrightness, bouncetime=2000)
    

        
    
    if (GPIO.input(button_add)):
        brightness, past_brightness = AddBrightness(brightness, past_brightness)
    if (GPIO.input(button_sub)):
        brightness, past_brightness = SubBrightness(brightness, past_brightness)
        
    if (GPIO.input(button_play)):
        Play_scanner()
        
    if (GPIO.input(button_shutdown)):
        Shutdown()
        
    if past_brightness != brightness :
        past_brightness = brightness

        pixels = neopixel.NeoPixel(board.D18, 60, pixel_order=neopixel.RGBW, brightness=brightness)
        
        for i in range(60):
            pixels[i] = (250, 250, 250, 0)