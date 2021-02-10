import RPi.GPIO as GPIO
import time

print("Hello")
####################################
############### INIT ###############
####################################

###### ARM ######

servoPIN = 27
GPIO.setmode(GPIO.BCM)
GPIO.setup(servoPIN, GPIO.OUT)

arm = GPIO.PWM(servoPIN, 50) # GPIO 17 for PWM with 50Hz
arm.start(2.5) # Initialization

###### BASE ######

servo2PIN = 17
GPIO.setmode(GPIO.BCM)
GPIO.setup(servo2PIN, GPIO.OUT)

base = GPIO.PWM(servo2PIN, 50) # GPIO 17 for PWM with 50Hz
base.start(2.5) # Initialization

####################################
############## ANGLES ##############
####################################

#(angle/18)+2
angleU = 
angleD =
angleL =
angleC = 
angleR =


up = (angleU/18)+2
down = (angleD/18)+2

left = (angleL/18)+2
center = (angleC/18)+2
right = (angleR/18)+2

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


####################################
############# Sequence #############
####################################
try:
    bCenter()
  while True:
    print("looped")

    aDown()
    #POMP
    aUp()
    bLeft()
    #RELEASE
    bCenter()
    aDown()
    #POMP
    aUp()
    bRight()
    #RELEASE
    bCenter()



except KeyboardInterrupt:
  arm.stop()
  base.stop()
  GPIO.cleanup()
