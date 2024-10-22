// Function to get the field name and object key
export const getNameAndObjKey = (name: string): [string, string] => {
    // Check if the input is a string and not empty
    if (typeof name !== 'string' || name.trim() === '') {
        throw new Error("Invalid name: must be a non-empty string."); // Throw error for invalid input
    }

    // Extract the field name (the part before the first '[')
    const fieldName: string = name.split('[')[0]; // e.g., "user" from "user[0][email]"

    // Match the pattern of '[key]' using regex (removing numeric indices)
    const regex = /\[([a-zA-Z0-9-_]+)\]/g; // Match keys in brackets

    // Create an array to hold the extracted parts
    const parts: string[] = [];
    let match: RegExpExecArray | null;

    // Collect all matches
    while ((match = regex.exec(name)) !== null) {
        // Check if the first group (key) is matched
        if (match[1]) {
            parts.push(match[1]); // Push the key to parts
        }
    }

    // Create the object key by joining the parts
    const objKey: string = parts.length > 0 ? parts.join('.') : ""; // Join keys with dot notation

    // Return an array containing the field name and the constructed object key
    return [fieldName, objKey]; // Return the result as an array
}
