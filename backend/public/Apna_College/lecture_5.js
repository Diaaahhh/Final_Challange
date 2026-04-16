//function
// function sum (a,b){
//     return a+b
// }

// let s=sum(10,50)
// console.log(s);

//arrow function
// const multi= (a,b,c)=>{
//     return a*b*c
// }

// let ans = multi(10,20,90);
// console.log("Multiplication: ",ans);

// const add= (a,b,c)=>{
//     return a+b+c
// }

// let ans2 = add(10,20,90);
// console.log("Addition: ",ans2);

//Project

// function countVowels(string){
//     let count=0;
//     for (const char of string) {
//         if (char==="a"||char==="e"||char==="i"||char==="o"||char==="u"||char==="A"||char==="E"||char==="I"||char==="O"||char==="U") {
//             ++count;
//         }
//     }
//     return count;
// }
// let count= countVowels("I hate my neighbour");
// console.log(count);

// const countVowels = (string) => {
//     let count = 0;
//     for (const char of string) {
//         if (char === "a" || char === "e" || char === "i" || char === "o" || char === "u" || char === "A" || char === "E" || char === "I" || char === "O" || char === "U") {
//             ++count;
//         }
//     }
//     return count;
// }
// let count = countVowels("I hate my neighbour");
// console.log(count);

//for-each method
// let marks = [20, 65, 26, 59, 99];
// marks.forEach(function printf(val) {
//     console.log(val)
// })

//for-each-arrow method
// let marks = [20, 65, 26, 59, 99];
// marks.forEach( (mark)=> {
//     console.log(mark)
// })
//project
let squares= [2,3,4,5,6,7]
squares.forEach((square)=>{
    console.log(`Square of ${square}= ${square*square}`)
})