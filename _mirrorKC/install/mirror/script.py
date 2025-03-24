import time
from http.client import HTTPResponse
from urllib import request


def read_lastrun(file_path: str) -> str:
    """
    Reads the last run timestamp from a file.

    This function reads the contents of the given file and returns the timestamp
    without the last 3 characters (milliseconds).

    :param file_path: the path to the file
    :returns: the last run timestamp
    """
    with open(file_path, "r") as f:
        return f.read()[:-3]


def write_lastrun(file_path: str, value: str) -> None:
    """
    Writes the last run timestamp from a file.

    :param file_path: the path to the file
    :param value: the last run timestamp
    """
    with open(file_path, "w") as f:
        f.write(value)


def log_message(log_path: str, message: str) -> None:
    """
    Writes a message to the specified log file.

    :param log_path: the path to the log file
    :param message: the message to write
    """
    with open(log_path, "a") as log_file:
        log_file.write(message)


def execute_update(log_path: str, url: str, sleep_time: int) -> None:
    """
    Executes the update script and logs the outcome.

    This function sends a request to the specified URL to execute an update.
    It logs the response status of the update to the specified log file and
    sleeps for a specified amount of time if the update is successful,
    or for 1 hour if the update fails.

    :param log_path: The path to the log file
    :param url: The URL to request the update from
    :param sleep_time: The time to sleep in seconds if the update is successful
    """
    # Send a request to the given URL and read the response
    response: HTTPResponse = request.urlopen(url)

    # Check if the response was successful
    if response.status == 200:
        # Log a success message and sleep for the specified time
        log_message(log_path=log_path, message="\n<b>Mirror update started successfully.</b>\n")
        time.sleep(sleep_time)
    else:
        # Log an error message with the response status and sleep for 1 hour
        log_message(log_path=log_path, message=f"\n<b>ERROR during mirror update. Status: {response.status}</b>\n")
        time.sleep(3600)


def main():
    """
    The main function of the script.

    This function contains an infinite loop that checks when the last update was
    and executes the update script if it's been more than 8 hours since the last
    update. It also logs a message to the specified log file when it starts and
    when it sleeps for a certain amount of time.
    """
    lastrun_path = "/var/lib/mirror/lastrun"  # The path to the file that contains the timestamp of the last update
    log_path = "/var/log/mirror.log"  # The path to the log file
    update_url = "http://localhost/mirrorkc.php"  # The URL to request the update from
    sleep_8_hours = 29000  # The time to sleep in seconds if the update is successful

    # Initial delay
    time.sleep(10)

    while True:
        lastrun = read_lastrun(lastrun_path)  # Read the content of the lastrun file
        current_time = int(time.time())  # Get the current time in seconds

        # If the file content is not a number or the number is greater than the current time
        if not (lastrun and lastrun.isdigit() and int(lastrun) <= current_time):
            write_lastrun(file_path=lastrun_path, value="0")  # Write 0 to the file
            execute_update(log_path=log_path, url=update_url, sleep_time=sleep_8_hours)
        else:
            lastrun_timestamp = int(lastrun)  # Convert the content to an integer
            # Calculate the difference between the current time and the last update
            diff = current_time - lastrun_timestamp

            # Check if it's been more than 8 hours since the last update
            if diff >= sleep_8_hours:
                # Execute the update script and log the outcome
                execute_update(log_path=log_path, url=update_url, sleep_time=sleep_8_hours)
            else:
                # Calculate the remaining time until the next update
                remaining_time = sleep_8_hours - diff
                # Log a message with the remaining time
                log_message(
                    log_path=log_path,
                    message=f"\n<b>The next mirror update will start in {remaining_time} seconds</b>\n",
                )
                time.sleep(remaining_time)  # Sleep for the remaining time


if __name__ == "__main__":
    main()
