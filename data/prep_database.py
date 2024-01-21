from os.path import exists
import re
import json
import sqlite3


def setup_sqlite(filename):
    conn = sqlite3.connect(filename)
    cursor = conn.cursor()
    
    # get columns
    ucsc_pattern = '[A-Z]{2,4}\s[0-9]+[A-Z]?'
    sqlite_cols = ''
    for course in clean_dict('./data/ccs/2.json').keys():
        course = re.search(ucsc_pattern, course)
        if course:
            sqlite_cols += f'"{course.group()}" TEXT,\n'

    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS course_equivalencies (
            schoolID INTEGER PRIMARY KEY,
            schoolName TEXT,
            {sqlite_cols[:-2]}
            )
    ''')

def populate_sqlite(filename, cc_id, cc_name, cc_courses):
    conn = sqlite3.connect(filename)
    cursor = conn.cursor()
    cc_courses['schoolID'] = cc_id
    cc_courses['schoolName'] = cc_name
    columns = ', '.join(cc_courses.keys())
    placeholders = ', '.join('?' for _ in cc_courses)
    insert_statement = f'INSERT INTO course_equivalencies ({columns}) VALUES ({placeholders})'

    cursor.execute(insert_statement, list(cc_courses.values()))


def clean_dict(path) -> dict:
    ucsc_pattern = '[A-Z]{2,4}\s[0-9]+[A-Z]?'
    cc_code_pattern = '[A-Z]+\s[A-Z]?[0-9]+[A-Z]?'
    cc_name_pattern = '  [\w -]+?  '
    sepReplace = {
        'And\n': ' [AND] ',
        'Or\n': ' [OR] '
    }
    rel_db = dict()
    with open(path, 'r') as f:
        for ucsc_course, cc_course in json.load(f).items():
            ucsc_course = re.match(ucsc_pattern, ucsc_course)
            if not ucsc_course:
                continue
            rel_db['"'+ucsc_course.group()+'"'] = 'NONE'

            if '\n' in cc_course:
                if 'And\n' in cc_course:
                    sep = 'And\n'
                if 'Or\n' in cc_course:
                    sep = 'Or\n'
                cc_course = cc_course.split(sep)
                result = ['NONE | NONE'] * len(cc_course)
                for i, substr in enumerate(cc_course):
                    str_code = re.search(cc_code_pattern, substr)
                    str_name = re.search(cc_name_pattern, substr)
                    if str_code and str_name:
                        result[i] = str_code.group() + ' | ' + str_name.group().strip()
                rel_db['"'+ucsc_course.group()+'"'] = sepReplace[sep].join(result)
    return rel_db


def populate_sqlite(filename, cc_id, cc_name, cc_courses):
    conn = sqlite3.connect(filename)
    cursor = conn.cursor()
    
    try:
        cc_courses['schoolID'] = cc_id
        cc_courses['schoolName'] = cc_name
        columns = ', '.join(cc_courses.keys())
        placeholders = ', '.join('?' for _ in cc_courses)
        insert_statement = f'INSERT INTO course_equivalencies ({columns}) VALUES ({placeholders})'

        cursor.execute(insert_statement, list(cc_courses.values()))

        # Commit the changes to the database
        conn.commit()

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    
    finally:
        # Close the database connection
        conn.close()

def main():
    setup_sqlite('./data/courses.sqlite')
    
    with open('./data/agreementIDs.json', 'r') as file:
        for id, name in json.load(file).items():
            try:
                path = f'./data/ccs/{id}.json'
                cc_courses = clean_dict(path=path)
            except FileNotFoundError:
                continue
            populate_sqlite('./data/courses.sqlite', cc_id=id, cc_name=name, cc_courses=cc_courses)

# Run the main function
if __name__ == "__main__":
    main()