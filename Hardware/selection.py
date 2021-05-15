import Pi_funct as fun
from time import sleep
import RPi.GPIO as GPIO
import glob
import os
import requests
import sys

buzzer = 12
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(buzzer, GPIO.OUT)
GPIO.output(buzzer,True)

pompePIN = 4
pompe = GPIO.setup(pompePIN, GPIO.OUT)
GPIO.output(pompePIN, 1)

def stop(button) :
    sleep(1.5)
    print(button)
    exit()
    
button_play = 15 #define
GPIO.setup(button_play,GPIO.IN, pull_up_down=GPIO.PUD_DOWN)


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

pwmR.ChangeDutyCycle(100)
pwmG.ChangeDutyCycle(100)
pwmB.ChangeDutyCycle(0)


# prev_input = 1
play = True,


def pdf_ok(): #goes left
    print("PDF_ok")
    fun.bCenter()
    fun.aDown()
    fun.valveON()
    fun.aUp()
    fun.bLeft()
#     fun.aDown()
    fun.valveOFF()
#     fun.aUp()

def pdf_nok(): #goes right
    print("PDF_nok")
    fun.bCenter()
    fun.aDown()
    fun.valveON()
    fun.aUp()
    fun.bRight()
#     fun.aDown()
    fun.valveOFF()
#     fun.aUp()



def run():
    print("running")
    while(1) :
#        GPIO.add_event_detect(button_play, GPIO.HIGH, callback = stop("stop button"), bouncetime = 1000)
#         input = GPIO.input(27)
# 
#         if ((not input) and prev_input):
#             if not playing:
#                 os.system('sudo mpc play')
#                 playing = True
#             else:
#                 os.system('sudo mpc pause')
#                 playing = False

        sleep(1)
        fun.takePic()
        sleep(1)
        print("Photo")
        goodPage = fun.isGoodPage("/home/pi/Desktop/img/image.PNG")
        print("hi")
        state = ''
        if goodPage :
            print("PDF okay")
            pdf_ok() #Goes LEFT
            print("Am I left ?")
            state = fun.uploadPic()

        else :
            print("Is not our pdf file")
            state = fun.uploadPic()
            if state != "finished":
                pdf_nok() #Goes RIGHT
         
            else:
                fun.aRest()
        
                try :
                    GPIO.output(pompePIN, 0)
                    file = glob.glob('/home/pi/Desktop/img/*.pdf')
                    print("sending file", file[0])
                    GPIO.output(pompePIN, 0)
                    first_split = file[0].split('/')
                    lessonId = first_split[-1].split('.')[0]
                    r = requests.post("https://95.182.241.187:9898/upload/scans/robot", files={"file":open(file[0], "rb")}, verify = False, data={'token': 'secretToken', 'examid' : lessonId})
                    print(r)
                except :
                    pwmR.ChangeDutyCycle(100)
                    pwmG.ChangeDutyCycle(0)
                    pwmB.ChangeDutyCycle(0)
                print("Scanning is finished  !!!!!!")
                for i in range (1) :
                    for time in range (4000):
                        GPIO.output(buzzer,True)
                        sleep(0.00005)
                        GPIO.output(buzzer, False)
                        sleep(0.00005)
                        time +=1
                    sleep(0.3)
                    
                    i+=1
                break
                

            
            
run()