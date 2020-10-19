#-*- coding:utf-8 -*-
'''
inputDialog
'''
__author__ = 'Tony Zhu'

from PyQt5.QtWidgets import QApplication, QWidget, QLineEdit, QInputDialog, QGridLayout, QLabel, QPushButton, QFrame

class InputDialog(QWidget):
    def __init__(self):       
        super(InputDialog,self).__init__()
        self.initUi()

    def initUi(self):
        self.setWindowTitle("黄金点游戏")
        self.setGeometry(200,200,1000,1000)

        label1=QLabel("游戏人数:")
        label2=QLabel("黄金分割常数")
        label3=QLabel("游戏轮数")
        label4=QLabel("游戏结果:")


        self.nameLable = QLabel("10")
        self.nameLable.setFrameStyle(QFrame.Panel|QFrame.Sunken)
        self.styleLable = QLabel("0.618")
        self.styleLable.setFrameStyle(QFrame.Panel|QFrame.Sunken)
        self.numberLable = QLabel("10")
        self.numberLable.setFrameStyle(QFrame.Panel|QFrame.Sunken)
        self.costLable = QLabel(" ")
        self.costLable.setFrameStyle(QFrame.Panel|QFrame.Sunken)



        nameButton=QPushButton("...")
        nameButton.clicked.connect(self.selectName)
        styleButton=QPushButton("...")
        styleButton.clicked.connect(self.selectStyle)
        numberButton=QPushButton("...")
        numberButton.clicked.connect(self.selectNumber)
        costButton=QPushButton("next")
        costButton.clicked.connect(self.selectCost)
        reButton=QPushButton("restart")
        reButton.clicked.connect(self.selectRe)


        mainLayout=QGridLayout()
        mainLayout.addWidget(label1,0,0)
        mainLayout.addWidget(self.nameLable,0,1)
        mainLayout.addWidget(nameButton,0,2)
        mainLayout.addWidget(label2,1,0)
        mainLayout.addWidget(self.styleLable,1,1)
        mainLayout.addWidget(styleButton,1,2)
        mainLayout.addWidget(label3,2,0)
        mainLayout.addWidget(self.numberLable,2,1)
        mainLayout.addWidget(numberButton,2,2)
        mainLayout.addWidget(label4,3,0)
        mainLayout.addWidget(self.costLable,4,1)
        mainLayout.addWidget(costButton,3,1)
        mainLayout.addWidget(reButton,3,2)

        self.setLayout(mainLayout)



    def selectName(self):
        global n 
        global points 
        n,ok = QInputDialog.getInt(self,"游戏人数","请输入游戏人数：",int(self.nameLable.text()),10,100,1)
        #print(n) 
        if ok :
            points = np.zeros(n)     
            self.nameLable.setText(str(n))

    def selectStyle(self):
        global ra
        ra,ok = QInputDialog.getDouble(self,"黄金分割常数","请输入黄金分割常数：",0.618,0,1,10)
        #number2,ok = QInputDialog.getDouble(self, "Get double","Value:", 10.05, 0, 100, 10)
        if ok :
            self.styleLable.setText(str(ra))

    def selectNumber(self):
        global terms 
        global tnow
        terms,ok = QInputDialog.getInt(self,"游戏轮数","请输入游戏轮数：",int(self.numberLable.text()),10,100,2)
        if ok :
            tnow = terms
            self.numberLable.setText(str(terms))

    def selectCost(self):
        global ra
        global n 
        global terms 
        global points 
        global tnow
        winner = -1
        miner = 101
        loser = -1
        maxer = -1
        
        if (tnow > 0):
            ans = np.zeros(n)
            for i in range(n):      
                number,ok = QInputDialog.getDouble(self,"用户"+str(i),"用户"+str(i)+"的回合,请输入你选定的数字：",50,0,100,10)
                if ok :
                   ans[i] = number
            mea = np.mean(ans)
            gnum = ra * mea
            #print(gnum)
            for j in range(n):
               er = abs(ans[j] - gnum)
               #print(er)
               if (er < miner):
                    miner = er
                    winner = j
               if (er > maxer):
                    maxer = er
                    loser = j
            points[winner] = points[winner] + n
            points[loser] = points[loser] - 2
            tnow = tnow - 1
            self.costLable.setText(str(points))

    def selectRe(self):
        global n 
        global terms 
        global points 
        global tnow
        self.costLable.setText(" ")   
        tnow = terms
        points = np.zeros(n)                  



if __name__=="__main__":
    import numpy as np
    import sys
    n = 10 
    ra = 0.618
    terms = 10
    tnow = 10
    points = np.zeros(n)
    app=QApplication(sys.argv)
    myshow=InputDialog()
    myshow.show()
    sys.exit(app.exec_())