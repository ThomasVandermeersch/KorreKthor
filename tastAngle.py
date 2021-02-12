import RPi.GPIO as GPIO
import time

print("Hello")
GPIO.setmode(GPIO.BCM)

###### ARM ######

servoPIN = 27
GPIO.setup(servoPIN, GPIO.OUT)

arm = GPIO.PWM(servoPIN, 50) # GPIO 17 for PWM with 50Hz
#arm.start(2.5) # Initialization

###### BASE ######

servo2PIN = 17
GPIO.setup(servo2PIN, GPIO.OUT)

base = GPIO.PWM(servo2PIN, 50) # GPIO 17 for PWM with 50Hz
#base.start(2.5) # Initialization

###### VALVE ######

valvePIN = 22
GPIO.setup(valvePIN, GPIO.OUT)


#(angle/18)+2

try:
    GPIO.output(valvePIN, 0)
    
    while True:
        print("true")




except KeyboardInterrupt:
  arm.stop()

  GPIO.cleanup()


