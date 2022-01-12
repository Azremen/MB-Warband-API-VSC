import os

tags = ["<snippet>", "<content>", "</content>",
"<tabTrigger>", "<scope>", "<description>", "</snippet>"]

betweens = ["<content>", "<![CDATA[", "]]>"]

with open("mbap.code-snippets", "w") as f:
    f.write("{\n")

for file_name in os.listdir("."):
    newFirstLine = ""
    if file_name.endswith(".sublime-snippet"):
        old_name = file_name
        file_name = os.path.splitext(file_name)[0]

    with open(old_name, "rt+") as f:
        old_data = f.read().split("\n")
        old_data = "\n".join([x.replace("\t", "").replace(" ", "") for x in old_data if x])

        f.seek(0)
        f.truncate()
        f.write(old_data)

    with open(old_name, "rt") as f:
        old_data = f.read()
        f.close()
    
    new_data = ""
    start_end_bool = True #1: Start, 0: End
    for char in old_data:
        if char == "\"":
            if start_end_bool:
                new_data += " \""#start
            else:
                new_data += "\"" #end
            start_end_bool = not start_end_bool
        elif char == "\\":
            new_data += "\\\\"
        else:
            new_data += char

    for line in new_data.split("\n"):
        if line.startswith(betweens[0]):
#            print("line startswith: {}".format(betweens[0]))
            exact = line
            exact = exact.split("".join(betweens[0:2]))
            newFirstLine = "".join(exact)
        elif line.endswith(betweens[2]):
#            print("line endswith: {}".format(betweens[2]))
            exact = line
            exact = exact.split(betweens[2])
            exact = "".join(exact)
            newFirstLine += exact

    replaced = [ 
        " " * 4 + "\"{}\": ".format(file_name) + "{",
        " " * 8 + "\"body\": \"{}\",".format(newFirstLine),
        " " * 8 + "\"prefix\": \"{}\",".format(file_name),
        " " * 8 + "\"scope\": \"python\"",
        " " * 4 + "},"
    ]

    with open("mbap.code-snippets", "a") as f:
        f.write("\n".join(replaced) + "\n\n")

with open("mbap.code-snippets", "a") as f:
    f.write("\n}")