import os

tags = ["<snippet>", "<content>", "</content>", "<tabTrigger>", "<scope>", "<description>", "</snippet>"]
betweens = ["<content>", "<![CDATA[", "]]>"]

script_directory = os.path.dirname(os.path.abspath(__file__))
input_directory = os.path.join(script_directory, "snippets/")  # Adjust the relative path
output_file = os.path.join(script_directory, "snippets/mbap.code-snippets")  # Adjust the relative path

with open(output_file, "w") as f:
    f.write("{\n")

for file_name in os.listdir(input_directory):
    if file_name.endswith(".sublime-snippet") and os.path.isfile(os.path.join(input_directory, file_name)):
        old_name = os.path.join(input_directory, file_name)
        file_name = os.path.splitext(file_name)[0]

        with open(old_name, "rt+") as f:
            old_data = f.read().split("\n")
            old_data = "\n".join([x.replace("\t", "").replace(" ", "") for x in old_data if x])

            f.seek(0)
            f.truncate()
            f.write(old_data)

        with open(old_name, "rt") as f:
            old_data = f.read()

        new_data = ""
        start_end_bool = True  # 1: Start, 0: End
        for char in old_data:
            if char == "\"":
                new_data += '"'
                start_end_bool = not start_end_bool
            elif char == "\\":
                new_data += "\\\\"
            else:
                new_data += char

        newFirstLine = ""
        for line in new_data.split("\n"):
            if line.startswith(betweens[0]):
                exact = line.split("".join(betweens[0:2]))
                newFirstLine = "".join(exact)
            elif line.endswith(betweens[2]):
                exact = line.split(betweens[2])
                newFirstLine += "".join(exact)

        replaced = [" " * 4 + "\"{}\": ".format(file_name) + "{",
                    " " * 8 + "\"body\": \"{}\",".format(newFirstLine),
                    " " * 8 + "\"prefix\": \"{}\",".format(file_name),
                    " " * 8 + "\"scope\": \"python\"",
                    " " * 4 + "},"]

        with open(output_file, "a") as f:
            f.write("\n".join(replaced) + "\n\n")

with open(output_file, "a") as f:
    f.write("\n}")
