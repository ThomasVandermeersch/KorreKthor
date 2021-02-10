import RPi.GPIO as GPIO
import time

print("Hello")

servoPIN = 27
GPIO.setmode(GPIO.BCM)
GPIO.setup(servoPIN, GPIO.OUT)

servo2PIN = 17
GPIO.setmode(GPIO.BCM)
GPIO.setup(servo2PIN, GPIO.OUT)

#servo3PIN = 22
#GPIO.setmode(GPIO.BCM)
#GPIO.setup(servo3PIN, GPIO.OUT)

#r = GPIO.PWM(servo3PIN, 50) # GPIO 17 for PWM with 50Hz
#r.start(2.5) # Initialization

p = GPIO.PWM(servoPIN, 50) # GPIO 17 for PWM with 50Hz
p.start(2.5) # Initialization

q = GPIO.PWM(servo2PIN, 50) # GPIO 17 for PWM with 50Hz
q.start(2.5) # Initialization

#(angle/18)+2

try:

  while True:
    print("true")

    
    p.ChangeDutyCycle(2)
    time.sleep(2)
    
    q.ChangeDutyCycle(3)
    time.sleep(2)
    
    p.ChangeDutyCycle(4)
    time.sleep(2)
    
    q.ChangeDutyCycle(5)
    time.sleep(2)

except KeyboardInterrupt:
  p.stop()
  q.stop()
  GPIO.cleanup()
