//String
let name = "    Fariha Anjum Dia   ";
// console.log(name.length);
// console.log(name[0]);
// console.log(`My name is ${name}`)
// console.log(`My age is ${1+3+1} years`)
// console.log(`Hi\nbabe`);
// console.log(`Hi\tbabe`);
// console.log(`Hi\n\tbabe`);
// Strings are immutable in javascript that means they don't get changed. Example:

name.toUpperCase();
// console.log(name);
let name2 = name.toLowerCase()
// console.log(name2);
// console.log(name.trim());//only cuts the first and last space off

let str1= "01234567", str2= "ASDFGHJ"
// console.log(str1.slice(2,5));
// console.log(str2.concat(str1))
// console.log(str2.replace("SD","22"))

// Project

let fullName= prompt("Enter your full name: "),
trimmedName= fullName.replace(/\s+/g,""), 
smallName= trimmedName.toLowerCase(),
length= smallName.length,
userName= "@"+smallName+length;
console.log(userName);

