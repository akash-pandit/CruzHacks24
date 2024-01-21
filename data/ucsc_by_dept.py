import json

"""
short python script to isolate ucsc's courses by department

example:
CSE 20
CSE 30
CSE 40
BIOL 20A

becomes

{
    CSE: [20, 30, 40]
    BIOL: [20A]
}

outputs: ~/data/ucscByDept.json
"""

def main():
    # all raw course files have same ucsc courses
    with open('./data/ccs/2.json', 'r') as f:
        courses = json.load(f)

    ucscCourses = dict()

    firstLineSkipped = False
    for ucsc, _ in courses.items():
        # remove some invalid entries
        if not firstLineSkipped:
            firstLineSkipped = True
            continue
        if len(ucsc.split()) < 2:
            continue
        
        dept, num = ucsc.split()[:2]

        
        # remove the rest of the invalid entries
        if not num[0].isnumeric():
            continue
        
        # add valid entries
        if dept not in ucscCourses.keys():
            ucscCourses[dept] = []
        ucscCourses[dept].append(num)

    with open('./data/ucscByDept.json', 'w') as f:
        json.dump(ucscCourses, f, indent=4)

if __name__ == '__main__':
    main()