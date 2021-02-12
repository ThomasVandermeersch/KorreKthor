import RPi.GPIO as GPIO
import time

print("Hello")
####################################
############### INIT ###############
####################################
GPIO.setmode(GPIO.BCM)

###### ARM ######

servoPIN = 27
GPIO.setup(servoPIN, GPIO.OUT)

arm = GPIO.PWM(servoPIN, 50) # GPIO 17 for PWM with 50Hz
arm.start(2.5) # Initialization

###### BASE ######

servo2PIN = 17
GPIO.setup(servo2PIN, GPIO.OUT)

base = GPIO.PWM(servo2PIN, 50) # GPIO 17 for PWM with 50Hz
base.start(2.5) # Initialization

###### VALVE ######

valvePIN = 22
GPIO.setup(valvePIN, GPIO.OUT)




####################################
############## ANGLES ##############
####################################

#(angle/18)+2



up = 2.2
down = 5

left = 11
center = 7
right = 3

####################################
############# Movement #############
####################################
def bLeft():
    base.ChangeDutyCycle(left)
    time.sleep(2)   
def bCenter():
    base.ChangeDutyCycle(center)
    time.sleep(2)
def bRight():
    base.ChangeDutyCycle(right)
    time.sleep(2)

def aDown():
    arm.ChangeDutyCycle(down)
    time.sleep(4)
def aUp():
    arm.ChangeDutyCycle(up)
    time.sleep(2)

def valveON():
    GPIO.output(valvePIN, 1)
    time.sleep(3)

def valveOFF():
    GPIO.output(valvePIN, 0)
    time.sleep(3)

####################################
############# Sequence #############
####################################
try:
    bCenter()
    while True:
        print("looped")

        aDown()
        valveON()#POMP
        aUp()
        bLeft()
        aDown()
        valveOFF() #RELEASE
        aUp()

        bCenter()

        aDown()
        valveON()#POMP
        aUp()
        bRight()
        aDown()
        valveOFF()#RELEASE
        aUp()

        bCenter()



except KeyboardInterrupt:
  arm.stop()
  base.stop()
  GPIO.cleanup()

