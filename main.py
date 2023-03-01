from flask import Flask, render_template, send_from_directory

app = Flask("__app__")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/iconServe/<path:path>")
def serve(path):
    return send_from_directory("static/alphaIcons", path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
