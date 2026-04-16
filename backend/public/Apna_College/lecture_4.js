//Arrays
// let marks = [10, 67.7, 56, 90, 34], names = ["Rahim", "Jashim", "Mokhles"];
// Array is mutable.
// console.log(marks[1]);
// names[1] = "Jashim vai"
// console.log(names[1]);
// console.log(names);
// marks[5] = "Dia"
// console.log(marks)
// marks[7] = "Adi"
// console.log(marks)
// for of is used on arrays and for in is used on objects
// for(mark of marks){
//     console.log(mark+1)
// }

// project-1
// let stdMarks= [34, 67, 97, 23, 56], sum=0
// for(stdMark of stdMarks)
// {
//     sum+=stdMark;
// }
// console.log(sum/5)
// project-2
// let prices= [250,645,300,900,50], i=0
// for(price of prices)
// {
//     prices[i]= 9/10*price
//     ++i
// }
// console.log(prices)

//push(), pop(), toString()

// let veg=["potato", "tomato", "carrot", "cabbage"]
// let pushed= veg.push("pumpkin", "mushroom")
// console.log(pushed, veg)

// let popped= veg.pop()
// console.log(popped, veg)

// let string= veg.toString()
// console.log(string, veg)

//concat, unshift, shift
// let veg=["potato", "tomato", "carrot", "cabbage"], fruits=["apple", "orange", "grape", "lychees"]
// let foods= veg.concat(fruits)
// console.log(foods)

// let unshifted = fruits.unshift("watermelon", "Blackberry")
// console.log(fruits)
// console.log(unshifted)

// let shifted = fruits.shift()
// console.log(fruits)
// console.log(shifted)

// splice, slice
// let items= [0,1,2,3,4,5,6,7,8,9]
// let Add= items.splice(3,0,500)
// console.log(Add)
// console.log(items)
// let Del= items.splice(3,3)
// console.log(Del)
// console.log(items)
// let Rep= items.splice(3,3, 500)
// console.log(Rep)
// console.log(items)
// let DelAll= items.splice(6)
// console.log(DelAll)
// console.log(items)

//project
let companies= ["Bloomberg", "Microsoft", "Uber", "Google", "IBM", "Netflix"]

let delFirst= companies.shift()
console.log(companies)

let repUberOla= companies.splice(1,1,"Ola")
console.log(companies)

let addLast= companies.push("Amazon")
console.log(companies)

